import { PrivyClient } from '@privy-io/server-auth';

// GAN Agent Key Quorum
const GAN_QUORUM_ID = 'bisl2gjkwgmzhp1x8p98c72o';

let privyClient = null;

// In-flight creation tracking (best-effort dedup for serverless)
const inFlightCreations = new Map();

function getPrivyClient() {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) throw new Error('Missing Privy credentials');
    privyClient = new PrivyClient(appId, appSecret);
  }
  return privyClient;
}

// Helper to check for existing wallet with retries
async function findExistingWallet(privy, userId, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const user = await privy.getUser(userId);
    const existingWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );
    if (existingWallet) {
      return existingWallet;
    }
    if (i < retries) {
      // Wait a bit before retrying (wallet might be mid-creation)
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return null;
}

export async function POST(request) {
  console.log('[create-wallet] POST request received');
  
  try {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    if (!appId || !appSecret) {
      return Response.json({ error: 'Missing Privy credentials' }, { status: 500 });
    }
    
    let userId;
    
    // Check for auth token first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const privy = getPrivyClient();
      try {
        const verifiedClaims = await privy.verifyAuthToken(token);
        userId = verifiedClaims.userId;
      } catch (e) {
        console.log('[create-wallet] Token verification failed:', e.message);
      }
    }
    
    // Or get from body (for onSuccess callback)
    if (!userId) {
      const body = await request.json().catch(() => ({}));
      userId = body.privyUserId;
    }
    
    if (!userId) {
      return Response.json({ error: 'No user ID provided' }, { status: 400 });
    }
    
    console.log('[create-wallet] User ID:', userId);

    // Check for in-flight creation (best-effort serverless dedup)
    if (inFlightCreations.has(userId)) {
      console.log('[create-wallet] Creation already in flight, waiting...');
      try {
        const result = await inFlightCreations.get(userId);
        return Response.json({ success: true, wallet: result, existing: true, deduped: true });
      } catch (e) {
        // Original creation failed, continue with fresh attempt
      }
    }

    const privy = getPrivyClient();
    
    // Check if user already has a wallet
    const existingWallet = await findExistingWallet(privy, userId, 0);
    
    if (existingWallet) {
      console.log('[create-wallet] User already has wallet:', existingWallet.address);
      return Response.json({ 
        success: true, 
        wallet: existingWallet.address,
        existing: true 
      });
    }

    // Create wallet with GAN signer attached
    console.log('[create-wallet] Creating wallet with GAN signer...');
    
    // Track this creation attempt
    const creationPromise = (async () => {
      const response = await fetch('https://api.privy.io/v1/wallets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'privy-app-id': appId,
          'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
        },
        body: JSON.stringify({
          chain_type: 'ethereum',
          owner: { user_id: userId },
          additional_signers: [{ signer_id: GAN_QUORUM_ID }],
        }),
      });

      const result = await response.json();
      console.log('[create-wallet] Privy response:', response.status, JSON.stringify(result));

      if (!response.ok) {
        // If wallet already exists error, try to fetch it
        if (result.error?.includes('already') || response.status === 409) {
          console.log('[create-wallet] Wallet likely exists, fetching...');
          const existing = await findExistingWallet(privy, userId, 2);
          if (existing) {
            return { address: existing.address, existing: true };
          }
        }
        throw new Error(result.error || `Privy API error: ${response.status}`);
      }

      return { address: result.address, walletId: result.id, signers: result.additional_signers };
    })();
    
    inFlightCreations.set(userId, creationPromise);
    
    try {
      const result = await creationPromise;
      return Response.json({ 
        success: true, 
        wallet: result.address,
        walletId: result.walletId,
        signers: result.signers,
        existing: result.existing || false,
      });
    } finally {
      // Clean up after 5 seconds (handles serverless cold start edge cases)
      setTimeout(() => inFlightCreations.delete(userId), 5000);
    }

  } catch (error) {
    console.error('[create-wallet] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
