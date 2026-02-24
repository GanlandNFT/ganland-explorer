import { PrivyClient } from '@privy-io/server-auth';

// GAN's authorization key ID - created in Privy Dashboard
const GAN_AUTHORIZATION_KEY_ID = 'cxz88rx36g27l2eo8fgwo6h8';

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
 * Get wallet ID from Privy API using wallet address
 */
async function getWalletIdByAddress(address) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  console.log('[gan-signer] Fetching wallet ID for address:', address);
  
  // List wallets from Privy API
  const response = await fetch(`https://auth.privy.io/api/v1/wallets?address=${address}`, {
    method: 'GET',
    headers: {
      'privy-app-id': appId,
      'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
  });
  
  const responseText = await response.text();
  console.log('[gan-signer] Wallets API response:', response.status, responseText);
  
  if (!response.ok) {
    // Try alternative endpoint - get wallet by owner
    return null;
  }
  
  try {
    const data = JSON.parse(responseText);
    // Response could be an array or have a data field
    const wallets = data.data || data.wallets || data;
    if (Array.isArray(wallets) && wallets.length > 0) {
      return wallets[0].id;
    }
    if (data.id) {
      return data.id;
    }
  } catch (e) {
    console.log('[gan-signer] Failed to parse wallets response:', e.message);
  }
  
  return null;
}

/**
 * Get wallet ID by user ID (alternative approach)
 */
async function getWalletIdByUserId(userId) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  console.log('[gan-signer] Fetching wallets for user:', userId);
  
  // Try to get user's wallets
  const response = await fetch(`https://auth.privy.io/api/v1/users/${userId}/wallets`, {
    method: 'GET',
    headers: {
      'privy-app-id': appId,
      'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
  });
  
  const responseText = await response.text();
  console.log('[gan-signer] User wallets API response:', response.status, responseText);
  
  if (!response.ok) {
    return null;
  }
  
  try {
    const data = JSON.parse(responseText);
    const wallets = data.data || data.wallets || data;
    if (Array.isArray(wallets) && wallets.length > 0) {
      // Find embedded wallet
      const embedded = wallets.find(w => w.wallet_type === 'privy' || w.type === 'embedded');
      return embedded?.id || wallets[0].id;
    }
  } catch (e) {
    console.log('[gan-signer] Failed to parse user wallets:', e.message);
  }
  
  return null;
}

/**
 * POST /api/gan-signer
 * Add GAN as a signer to user's wallet
 */
export async function POST(request) {
  console.log('[gan-signer] POST request received');
  
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
      return Response.json({ error: 'Server configuration error', details: e.message }, { status: 500 });
    }
    
    let verifiedClaims;
    try {
      verifiedClaims = await privy.verifyAuthToken(token);
    } catch (e) {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = verifiedClaims.userId;
    console.log('[gan-signer] Verified user:', userId);

    // Get user data
    const user = await privy.getUser(userId);
    
    // Find embedded wallet address
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ error: 'No embedded wallet found' }, { status: 404 });
    }

    const walletAddress = embeddedWallet.address;
    console.log('[gan-signer] Found wallet address:', walletAddress);

    // Try to get wallet ID from address
    let walletId = await getWalletIdByAddress(walletAddress);
    
    // If that fails, try by user ID
    if (!walletId) {
      walletId = await getWalletIdByUserId(userId);
    }
    
    // If still no wallet ID, check if SDK has it
    if (!walletId && user.wallet?.id) {
      walletId = user.wallet.id;
    }

    if (!walletId) {
      return Response.json({ 
        error: 'Could not find wallet ID',
        details: 'Wallet address found but Privy API did not return a wallet ID. You may need to enable Delegated Actions in Privy Dashboard.',
        walletAddress,
        userId,
        suggestion: 'Go to Privy Dashboard → Embedded Wallets → Enable Delegated Actions'
      }, { status: 400 });
    }

    console.log('[gan-signer] Found wallet ID:', walletId);

    // Add signer
    const result = await addSignerViaRest(walletId);
    
    return Response.json(result);

  } catch (error) {
    console.error('[gan-signer] Error:', error);
    return Response.json({ error: error.message || 'Failed to add signer' }, { status: 500 });
  }
}

async function addSignerViaRest(walletId) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  console.log('[gan-signer] Adding signer for wallet:', walletId);

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
  console.log('[gan-signer] Add signer response:', response.status, responseText);

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    throw new Error(errorData.message || errorData.error || `API error: ${response.status}`);
  }

  return { success: true, message: 'GAN signer enabled', walletId };
}

/**
 * GET /api/gan-signer
 */
export async function GET(request) {
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
    const user = await privy.getUser(userId);
    
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ enabled: false, reason: 'no_wallet' });
    }

    // Try to get wallet ID
    let walletId = await getWalletIdByAddress(embeddedWallet.address);
    if (!walletId) {
      walletId = await getWalletIdByUserId(userId);
    }

    return Response.json({
      enabled: embeddedWallet.delegated === true,
      walletAddress: embeddedWallet.address,
      walletId: walletId,
      delegated: embeddedWallet.delegated,
      hasWalletId: !!walletId,
    });

  } catch (error) {
    console.error('[gan-signer] GET error:', error);
    return Response.json({ enabled: false, reason: 'error', message: error.message });
  }
}
