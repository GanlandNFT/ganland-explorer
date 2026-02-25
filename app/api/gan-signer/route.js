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
  console.log('[gan-signer] POST request received');
  
  try {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    if (!appId || !appSecret) {
      return Response.json({ error: 'Missing Privy credentials' }, { status: 500 });
    }
    
    const body = await request.json().catch(() => ({}));
    const { privyUserId, walletAddress } = body;
    
    if (!privyUserId) {
      return Response.json({ error: 'No user ID provided' }, { status: 400 });
    }
    
    console.log('[gan-signer] User ID:', privyUserId);
    console.log('[gan-signer] Wallet Address:', walletAddress);

    // Get user's wallets to find the wallet ID
    const privy = getPrivyClient();
    const user = await privy.getUser(privyUserId);
    
    // Find the embedded wallet
    const embeddedWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );
    
    if (!embeddedWallet) {
      return Response.json({ error: 'No embedded wallet found' }, { status: 404 });
    }

    console.log('[gan-signer] Found wallet:', embeddedWallet.address);

    // Get wallet details to find wallet ID
    const walletsResponse = await fetch(`https://api.privy.io/v1/users/${privyUserId}/wallets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': appId,
        'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
      },
    });

    const walletsData = await walletsResponse.json();
    console.log('[gan-signer] User wallets:', JSON.stringify(walletsData));

    // Find the wallet by address
    const wallet = walletsData.data?.find(w => 
      w.address?.toLowerCase() === embeddedWallet.address.toLowerCase()
    );

    if (!wallet?.id) {
      // Try alternative: list all wallets and find by address
      const allWalletsResponse = await fetch('https://api.privy.io/v1/wallets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'privy-app-id': appId,
          'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
        },
      });
      
      const allWalletsData = await allWalletsResponse.json();
      const foundWallet = allWalletsData.data?.find(w =>
        w.address?.toLowerCase() === embeddedWallet.address.toLowerCase()
      );
      
      if (!foundWallet?.id) {
        console.log('[gan-signer] Could not find wallet ID, signer not added');
        return Response.json({ 
          success: true, 
          wallet: embeddedWallet.address,
          signerAdded: false,
          reason: 'Could not find wallet ID'
        });
      }
      
      wallet.id = foundWallet.id;
    }

    console.log('[gan-signer] Wallet ID:', wallet.id);

    // Check if GAN signer is already added
    const existingSigners = wallet.additional_signers || [];
    const hasGanSigner = existingSigners.some(s => s.signer_id === GAN_QUORUM_ID);
    
    if (hasGanSigner) {
      console.log('[gan-signer] GAN signer already present');
      return Response.json({ 
        success: true, 
        wallet: embeddedWallet.address,
        signerAdded: false,
        reason: 'Already has GAN signer'
      });
    }

    // Add GAN signer to wallet
    console.log('[gan-signer] Adding GAN signer...');
    const addSignerResponse = await fetch(`https://api.privy.io/v1/wallets/${wallet.id}/signers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'privy-app-id': appId,
        'Authorization': `Basic ${Buffer.from(`${appId}:${appSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        signer_id: GAN_QUORUM_ID,
      }),
    });

    const addSignerResult = await addSignerResponse.json();
    console.log('[gan-signer] Add signer response:', addSignerResponse.status, JSON.stringify(addSignerResult));

    if (!addSignerResponse.ok) {
      console.log('[gan-signer] Failed to add signer:', addSignerResult.error);
      return Response.json({ 
        success: true, 
        wallet: embeddedWallet.address,
        signerAdded: false,
        reason: addSignerResult.error || 'Failed to add signer'
      });
    }

    return Response.json({ 
      success: true, 
      wallet: embeddedWallet.address,
      signerAdded: true,
    });

  } catch (error) {
    console.error('[gan-signer] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
