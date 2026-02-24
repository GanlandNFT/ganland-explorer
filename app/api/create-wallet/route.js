import { PrivyClient } from '@privy-io/server-auth';

// GAN Agent Key Quorum
const GAN_QUORUM_ID = 'bisl2gjkwgmzhp1x8p98c72o';

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
  console.log('[create-wallet] POST request received');
  
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
    console.log('[create-wallet] User ID:', userId);

    // Check if user already has a wallet
    const user = await privy.getUser(userId);
    const existingWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );
    
    if (existingWallet) {
      console.log('[create-wallet] User already has wallet:', existingWallet.address);
      return Response.json({ 
        success: true, 
        wallet: existingWallet.address,
        existing: true 
      });
    }

    // Create wallet with GAN signer attached
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    console.log('[create-wallet] Creating wallet with GAN signer...');
    
    const response = await fetch('https://api.privy.io/v1/wallets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': appId,
        'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        chain_type: 'ethereum',
        // Owner is the user
        owner: {
          user_id: userId,
        },
        // GAN key quorum as additional signer
        additional_signers: [
          { signer_id: GAN_QUORUM_ID }
        ],
      }),
    });

    const result = await response.json();
    console.log('[create-wallet] Response:', response.status, JSON.stringify(result));

    if (!response.ok) {
      throw new Error(result.error || `Privy API error: ${response.status}`);
    }

    return Response.json({ 
      success: true, 
      wallet: result.address,
      walletId: result.id,
      signers: result.additional_signers,
    });

  } catch (error) {
    console.error('[create-wallet] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
