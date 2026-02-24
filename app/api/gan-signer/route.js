import { PrivyClient } from '@privy-io/server-auth';

const GAN_AUTHORIZATION_KEY_ID = 'cxz88rx36g27l2eo8fgwo6h8';

let privyClient = null;

function getPrivyClient() {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    if (!appId || !appSecret) throw new Error('Missing Privy credentials');
    privyClient = new PrivyClient(appId, appSecret);
  }
  return privyClient;
}

export async function POST(request) {
  console.log('[gan-signer] POST request received');
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const privy = getPrivyClient();
    
    let verifiedClaims;
    try {
      verifiedClaims = await privy.verifyAuthToken(token);
    } catch (e) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = verifiedClaims.userId;
    console.log('[gan-signer] User ID:', userId);

    // Get request body - frontend may pass wallet ID
    const body = await request.json();
    console.log('[gan-signer] Request body:', body);
    
    let walletId = body.walletId;
    const walletAddress = body.walletAddress;
    
    // If frontend sent wallet ID, use it directly!
    if (walletId) {
      console.log('[gan-signer] Using wallet ID from frontend:', walletId);
    } else {
      // Try to find from user
      const user = await privy.getUser(userId);
      console.log('[gan-signer] User linkedAccounts:', JSON.stringify(user.linkedAccounts, null, 2));
      
      const embeddedWallet = user.linkedAccounts?.find(
        a => a.type === 'wallet' && a.walletClientType === 'privy'
      );
      
      walletId = embeddedWallet?.id || embeddedWallet?.walletId;
      console.log('[gan-signer] Wallet ID from user:', walletId);
    }

    if (!walletId) {
      return Response.json({ 
        error: 'Wallet ID not found',
        details: 'Neither frontend nor backend could find the wallet ID. Check browser console for wallet object details.',
        walletAddress,
        frontendKeys: body.walletKeys,
      }, { status: 400 });
    }

    // Add the signer
    const result = await addSigner(walletId);
    return Response.json(result);

  } catch (error) {
    console.error('[gan-signer] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function addSigner(walletId) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  console.log('[gan-signer] Adding signer to wallet:', walletId);

  const response = await fetch(`https://api.privy.io/v1/wallets/${walletId}/signers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'privy-app-id': appId,
      'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
    body: JSON.stringify({
      type: 'authorization_key',
      authorization_key_id: GAN_AUTHORIZATION_KEY_ID,
    }),
  });

  const text = await response.text();
  console.log('[gan-signer] Add signer response:', response.status, text);

  if (!response.ok) {
    throw new Error(text || `Privy API error: ${response.status}`);
  }

  return { success: true, message: 'GAN signer enabled', walletId };
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const privy = getPrivyClient();
    
    const verifiedClaims = await privy.verifyAuthToken(token);
    const user = await privy.getUser(verifiedClaims.userId);
    
    // Check URL params for frontend wallet ID
    const url = new URL(request.url);
    const frontendWalletId = url.searchParams.get('walletId');
    
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ enabled: false, reason: 'no_wallet' });
    }

    const walletId = frontendWalletId || embeddedWallet?.id || embeddedWallet?.walletId;

    return Response.json({
      enabled: embeddedWallet.delegated === true,
      walletAddress: embeddedWallet.address,
      walletId: walletId,
      walletIdSource: frontendWalletId ? 'frontend' : 'backend',
      delegated: embeddedWallet.delegated,
    });

  } catch (error) {
    return Response.json({ enabled: false, reason: 'error', message: error.message });
  }
}
