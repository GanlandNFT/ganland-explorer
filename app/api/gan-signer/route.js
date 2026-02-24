import { PrivyClient } from '@privy-io/server-auth';

// GAN's authorization key ID - created in Privy Dashboard
const GAN_AUTHORIZATION_KEY_ID = 'cxz88rx36g27l2eo8fgwo6h8';

// Initialize Privy server client
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

/**
 * POST /api/gan-signer
 * Add GAN as a signer to user's wallet
 * 
 * Body: { walletId: string }
 * Headers: { Authorization: Bearer <privy-auth-token> }
 */
export async function POST(request) {
  try {
    // Verify the auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let verifiedClaims;
    try {
      verifiedClaims = await privy.verifyAuthToken(token);
    } catch (e) {
      console.error('[gan-signer] Token verification failed:', e.message);
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = verifiedClaims.userId;
    console.log('[gan-signer] Verified user:', userId);

    // Get request body
    const body = await request.json();
    const { walletId, walletAddress } = body;

    if (!walletId && !walletAddress) {
      return Response.json({ error: 'walletId or walletAddress required' }, { status: 400 });
    }

    // Get user's wallets to find the embedded wallet
    const user = await privy.getUser(userId);
    console.log('[gan-signer] User wallets:', user.linkedAccounts?.filter(a => a.type === 'wallet'));
    
    // Find the embedded wallet
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ error: 'No embedded wallet found' }, { status: 404 });
    }

    const targetWalletId = walletId || embeddedWallet.walletId;
    console.log('[gan-signer] Target wallet:', targetWalletId);

    // Add GAN as a signer on the wallet
    // Using Privy's wallet update API
    try {
      const result = await privy.walletApi.update({
        walletId: targetWalletId,
        additionalSigners: [
          {
            type: 'authorization_key',
            authorizationKeyId: GAN_AUTHORIZATION_KEY_ID,
          }
        ]
      });

      console.log('[gan-signer] ✅ Signer added:', result);
      
      return Response.json({
        success: true,
        message: 'GAN signer enabled',
        walletId: targetWalletId,
      });
    } catch (walletError) {
      console.error('[gan-signer] Wallet update error:', walletError);
      
      // Check if it's because the API method doesn't exist
      if (walletError.message?.includes('walletApi') || walletError.message?.includes('undefined')) {
        // Try alternative method - direct API call
        return await addSignerViaRest(targetWalletId, token);
      }
      
      throw walletError;
    }

  } catch (error) {
    console.error('[gan-signer] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to add signer',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Fallback: Add signer via direct REST API call
 */
async function addSignerViaRest(walletId, userToken) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  if (!appSecret) {
    return Response.json({ 
      error: 'Server not configured for signer management',
      hint: 'PRIVY_APP_SECRET environment variable required'
    }, { status: 500 });
  }

  // Try Privy's REST API directly
  const response = await fetch(`https://auth.privy.io/api/v1/wallets/${walletId}/signers`, {
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[gan-signer] REST API error:', response.status, errorText);
    return Response.json({ 
      error: 'Failed to add signer via API',
      status: response.status,
      details: errorText
    }, { status: response.status });
  }

  const result = await response.json();
  console.log('[gan-signer] ✅ Signer added via REST:', result);
  
  return Response.json({
    success: true,
    message: 'GAN signer enabled',
    walletId,
  });
}

/**
 * GET /api/gan-signer
 * Check if GAN signer is enabled for user's wallet
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const verifiedClaims = await privy.verifyAuthToken(token);
    const userId = verifiedClaims.userId;

    // Get user
    const user = await privy.getUser(userId);
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ 
        enabled: false, 
        reason: 'no_wallet' 
      });
    }

    // Check if wallet has delegation/signers
    // The wallet object should have a 'delegated' or 'signers' field
    const isEnabled = embeddedWallet.delegated === true || 
                      embeddedWallet.signers?.some(s => s.id === GAN_AUTHORIZATION_KEY_ID);

    return Response.json({
      enabled: isEnabled,
      walletAddress: embeddedWallet.address,
      walletId: embeddedWallet.walletId,
    });

  } catch (error) {
    console.error('[gan-signer] GET error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
