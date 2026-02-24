import { PrivyClient } from '@privy-io/server-auth';

// GAN's authorization key ID
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

/**
 * Get wallet ID from Privy Admin API - list all wallets and find by address
 */
async function getWalletIdFromAdmin(address) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  
  console.log('[gan-signer] Searching wallets for address:', address);
  
  // Try the embedded wallets list endpoint
  const response = await fetch(`https://auth.privy.io/api/v1/apps/${appId}/embedded_wallets`, {
    method: 'GET',
    headers: {
      'privy-app-id': appId,
      'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
  });
  
  console.log('[gan-signer] Embedded wallets API status:', response.status);
  
  if (response.ok) {
    const data = await response.json();
    console.log('[gan-signer] Embedded wallets response:', JSON.stringify(data).slice(0, 500));
    
    const wallets = data.data || data.wallets || data;
    if (Array.isArray(wallets)) {
      const match = wallets.find(w => 
        w.address?.toLowerCase() === address.toLowerCase()
      );
      if (match?.id) {
        console.log('[gan-signer] Found wallet ID from embedded_wallets:', match.id);
        return match.id;
      }
    }
  }
  
  // Try the general wallets endpoint
  const response2 = await fetch(`https://auth.privy.io/api/v1/apps/${appId}/wallets`, {
    method: 'GET',
    headers: {
      'privy-app-id': appId,
      'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
  });
  
  console.log('[gan-signer] Wallets API status:', response2.status);
  
  if (response2.ok) {
    const data = await response2.json();
    console.log('[gan-signer] Wallets response:', JSON.stringify(data).slice(0, 500));
    
    const wallets = data.data || data.wallets || data;
    if (Array.isArray(wallets)) {
      const match = wallets.find(w => 
        w.address?.toLowerCase() === address.toLowerCase()
      );
      if (match?.id) {
        console.log('[gan-signer] Found wallet ID from wallets:', match.id);
        return match.id;
      }
    }
  }

  // Try v0 API 
  const response3 = await fetch(`https://auth.privy.io/api/v0/wallets`, {
    method: 'GET',
    headers: {
      'privy-app-id': appId,
      'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
    },
  });
  
  console.log('[gan-signer] v0 Wallets API status:', response3.status);
  const text3 = await response3.text();
  console.log('[gan-signer] v0 response:', text3.slice(0, 500));
  
  return null;
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

    const user = await privy.getUser(userId);
    
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ error: 'No embedded wallet found' }, { status: 404 });
    }

    const walletAddress = embeddedWallet.address;
    console.log('[gan-signer] Wallet address:', walletAddress);

    // Get wallet ID from admin API
    const walletId = await getWalletIdFromAdmin(walletAddress);

    if (!walletId) {
      // Last resort - provide manual instructions
      return Response.json({ 
        error: 'Wallet ID not accessible via API',
        details: 'Please manually add the GAN Agent Signer to this wallet in Privy Dashboard',
        walletAddress,
        instructions: [
          '1. Go to dashboard.privy.io → Wallets',
          '2. Find wallet: ' + walletAddress,
          '3. Click on it → Add signer',
          '4. Select "GAN Agent Signer"'
        ]
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

  const text = await response.text();
  console.log('[gan-signer] Add signer response:', response.status, text);

  if (!response.ok) {
    throw new Error(text || `API error: ${response.status}`);
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
    
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (!embeddedWallet) {
      return Response.json({ enabled: false, reason: 'no_wallet' });
    }

    const walletId = await getWalletIdFromAdmin(embeddedWallet.address);

    return Response.json({
      enabled: embeddedWallet.delegated === true,
      walletAddress: embeddedWallet.address,
      walletId,
      delegated: embeddedWallet.delegated,
    });

  } catch (error) {
    return Response.json({ enabled: false, reason: 'error', message: error.message });
  }
}
