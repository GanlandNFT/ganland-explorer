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
 * Find the wallet ID from Privy user object
 * Privy stores wallet IDs in different places depending on SDK version
 */
function findWalletId(user) {
  // Method 1: Check user.wallet (newer SDK)
  if (user.wallet?.id) {
    return { walletId: user.wallet.id, source: 'user.wallet.id' };
  }
  
  // Method 2: Check linkedAccounts for embedded wallet with ID
  const embeddedWallet = user.linkedAccounts?.find(
    a => a.type === 'wallet' && a.walletClientType === 'privy'
  );
  
  if (embeddedWallet) {
    // Try various field names
    const walletId = embeddedWallet.id 
      || embeddedWallet.walletId 
      || embeddedWallet.wallet_id
      || embeddedWallet.embedded_wallet_id;
    
    if (walletId) {
      return { walletId, source: 'linkedAccounts', embeddedWallet };
    }
    
    // If no ID but we have address, the wallet might need to be fetched separately
    return { 
      walletId: null, 
      address: embeddedWallet.address,
      source: 'linkedAccounts_no_id',
      embeddedWallet,
      availableFields: Object.keys(embeddedWallet)
    };
  }
  
  return { walletId: null, source: 'not_found' };
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

    // Get user's data
    const user = await privy.getUser(userId);
    console.log('[gan-signer] User object keys:', Object.keys(user));
    console.log('[gan-signer] User linkedAccounts count:', user.linkedAccounts?.length);
    
    // Log full user object for debugging (remove in production)
    console.log('[gan-signer] Full user:', JSON.stringify(user, null, 2));

    // Find wallet ID
    const walletInfo = findWalletId(user);
    console.log('[gan-signer] Wallet info:', JSON.stringify(walletInfo, null, 2));

    if (!walletInfo.walletId) {
      // Try using the Privy SDK's wallet delegation method instead of REST
      if (walletInfo.address) {
        // Attempt to use SDK method if available
        try {
          // Try walletApi if available in SDK
          if (privy.walletApi?.addSigner) {
            const result = await privy.walletApi.addSigner({
              address: walletInfo.address,
              authorizationKeyId: GAN_AUTHORIZATION_KEY_ID
            });
            return Response.json({ 
              success: true, 
              message: 'GAN signer enabled via SDK',
              ...result 
            });
          }
        } catch (sdkError) {
          console.log('[gan-signer] SDK method failed:', sdkError.message);
        }
      }
      
      return Response.json({ 
        error: 'Wallet ID not found in user object',
        details: 'The Privy user object does not contain a wallet ID. This may require enabling delegation in the Privy Dashboard first.',
        debug: {
          source: walletInfo.source,
          address: walletInfo.address,
          availableFields: walletInfo.availableFields,
          userKeys: Object.keys(user)
        }
      }, { status: 400 });
    }

    // Try to add signer via REST API
    const result = await addSignerViaRest(walletInfo.walletId, privy);
    
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
    
    // Log full user for debugging
    console.log('[gan-signer] GET - Full user:', JSON.stringify(user, null, 2));
    
    // Find wallet info
    const walletInfo = findWalletId(user);
    
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
      walletId: walletInfo.walletId,
      walletIdSource: walletInfo.source,
      delegated: embeddedWallet.delegated,
      availableFields: Object.keys(embeddedWallet),
      userKeys: Object.keys(user),
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
