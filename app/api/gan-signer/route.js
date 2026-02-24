import { PrivyClient } from '@privy-io/server-auth';

// GAN's authorization key ID - created in Privy Dashboard
const GAN_AUTHORIZATION_KEY_ID = 'cxz88rx36g27l2eo8fgwo6h8';

// Lazy initialization to avoid build-time errors
let privyClient = null;

function getPrivyClient() {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    if (!appId || !appSecret) {
      throw new Error('Missing Privy credentials');
    }
    
    privyClient = new PrivyClient(appId, appSecret);
  }
  return privyClient;
}

/**
 * POST /api/gan-signer
 * Add GAN as a signer to user's wallet
 */
export async function POST(request) {
  console.log('[gan-signer] POST request received');
  
  try {
    // Check for auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[gan-signer] Missing auth header');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get Privy client
    let privy;
    try {
      privy = getPrivyClient();
    } catch (e) {
      console.error('[gan-signer] Privy client init failed:', e.message);
      return Response.json({ 
        error: 'Server configuration error',
        details: e.message 
      }, { status: 500 });
    }
    
    // Verify token
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
    const { walletAddress } = body;
    console.log('[gan-signer] Wallet address:', walletAddress);

    // Get user's wallets
    const user = await privy.getUser(userId);
    console.log('[gan-signer] User linked accounts:', user.linkedAccounts?.length);
    
    // Find the embedded wallet
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ error: 'No embedded wallet found' }, { status: 404 });
    }

    const walletId = embeddedWallet.id;
    console.log('[gan-signer] Wallet ID:', walletId);

    // Try to add signer via REST API directly
    const result = await addSignerViaRest(walletId, privy);
    
    return Response.json(result);

  } catch (error) {
    console.error('[gan-signer] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to add signer',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * Add signer via direct REST API call to Privy
 */
async function addSignerViaRest(walletId, privy) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  console.log('[gan-signer] Adding signer via REST for wallet:', walletId);

  // Privy API to add signers to a wallet
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

  const responseText = await response.text();
  console.log('[gan-signer] Privy API response:', response.status, responseText);

  if (!response.ok) {
    // Try to parse error
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    
    throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    result = { success: true };
  }

  return {
    success: true,
    message: 'GAN signer enabled',
    walletId,
    ...result
  };
}

/**
 * GET /api/gan-signer
 * Check if GAN signer is enabled
 */
export async function GET(request) {
  console.log('[gan-signer] GET request received');
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    let privy;
    try {
      privy = getPrivyClient();
    } catch (e) {
      return Response.json({ 
        enabled: false, 
        reason: 'server_error',
        message: e.message 
      });
    }
    
    let verifiedClaims;
    try {
      verifiedClaims = await privy.verifyAuthToken(token);
    } catch (e) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = verifiedClaims.userId;
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

    // Check if wallet has delegation
    const isEnabled = embeddedWallet.delegated === true;

    return Response.json({
      enabled: isEnabled,
      walletAddress: embeddedWallet.address,
      walletId: embeddedWallet.id,
    });

  } catch (error) {
    console.error('[gan-signer] GET error:', error);
    return Response.json({ 
      enabled: false,
      reason: 'error',
      message: error.message 
    });
  }
}
