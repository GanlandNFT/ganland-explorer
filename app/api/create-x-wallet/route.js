/**
 * Create wallet for X/Twitter user
 * Called when someone mentions @GanlandNFT wanting a wallet
 * 
 * POST /api/create-x-wallet
 * Body: { twitterId, twitterUsername, twitterName }
 */

const GAN_QUORUM_ID = 'bisl2gjkwgmzhp1x8p98c72o';

export async function POST(request) {
  console.log('[create-x-wallet] POST request received');
  
  try {
    const body = await request.json();
    const { twitterId, twitterUsername, twitterName } = body;
    
    if (!twitterId || !twitterUsername) {
      return Response.json({ 
        error: 'Missing twitterId or twitterUsername' 
      }, { status: 400 });
    }
    
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;
    
    if (!appId || !appSecret) {
      return Response.json({ error: 'Missing Privy credentials' }, { status: 500 });
    }
    
    const authHeader = Buffer.from(`${appId}:${appSecret}`).toString('base64');
    const headers = {
      'Content-Type': 'application/json',
      'privy-app-id': appId,
      'Authorization': `Basic ${authHeader}`,
    };
    
    // Step 1: Check if user already exists
    console.log('[create-x-wallet] Checking for existing user:', twitterUsername);
    const searchResponse = await fetch(
      `https://api.privy.io/v1/users?twitter_username=${twitterUsername}`,
      { headers }
    );
    
    let userId;
    let existingWallet = null;
    
    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      if (searchResult.data && searchResult.data.length > 0) {
        const existingUser = searchResult.data[0];
        userId = existingUser.id;
        console.log('[create-x-wallet] Found existing user:', userId);
        
        // Check if they already have a wallet
        const wallet = existingUser.linked_accounts?.find(
          a => a.type === 'wallet' && a.wallet_client_type === 'privy'
        );
        if (wallet) {
          console.log('[create-x-wallet] User already has wallet:', wallet.address);
          return Response.json({
            success: true,
            wallet: wallet.address,
            existing: true,
            userId,
          });
        }
      }
    }
    
    // Step 2: Create user if doesn't exist
    if (!userId) {
      console.log('[create-x-wallet] Creating new user for:', twitterUsername);
      const userResponse = await fetch('https://api.privy.io/v1/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          linked_accounts: [{
            type: 'twitter_oauth',
            subject: twitterId,
            username: twitterUsername,
            name: twitterName || twitterUsername,
          }],
        }),
      });
      
      if (!userResponse.ok) {
        const error = await userResponse.text();
        console.log('[create-x-wallet] User creation failed:', error);
        throw new Error(`Failed to create user: ${error}`);
      }
      
      const userData = await userResponse.json();
      userId = userData.id;
      console.log('[create-x-wallet] Created user:', userId);
    }
    
    // Step 3: Create wallet with GAN signer
    console.log('[create-x-wallet] Creating wallet with GAN signer...');
    const walletResponse = await fetch('https://api.privy.io/v1/wallets', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chain_type: 'ethereum',
        owner: { user_id: userId },
        additional_signers: [{ signer_id: GAN_QUORUM_ID }],
      }),
    });
    
    if (!walletResponse.ok) {
      const error = await walletResponse.text();
      console.log('[create-x-wallet] Wallet creation failed:', error);
      throw new Error(`Failed to create wallet: ${error}`);
    }
    
    const walletData = await walletResponse.json();
    console.log('[create-x-wallet] ✅ Wallet created:', walletData.address);
    
    return Response.json({
      success: true,
      wallet: walletData.address,
      walletId: walletData.id,
      userId,
      signers: walletData.additional_signers,
    });
    
  } catch (error) {
    console.error('[create-x-wallet] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
