/**
 * Create wallet for X/Twitter user
 * Called when someone mentions @GanlandNFT wanting a wallet
 * 
 * POST /api/create-x-wallet
 * Body: { twitterId, twitterUsername, twitterName }
 */

import { PrivyClient } from '@privy-io/server-auth';
import { createClient } from '@supabase/supabase-js';

const GAN_QUORUM_ID = 'bisl2gjkwgmzhp1x8p98c72o';

let privyClient = null;
let supabase = null;

function getPrivy() {
  if (!privyClient) {
    privyClient = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET
    );
  }
  return privyClient;
}

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (url && key) {
      supabase = createClient(url, key);
    }
  }
  return supabase;
}

// Look up existing Privy user by twitter handle
async function findExistingPrivyUser(twitterUsername, twitterId) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const authHeader = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'privy-app-id': appId,
    'Authorization': `Basic ${authHeader}`,
  };

  // Search Privy for user by twitter username
  const response = await fetch(
    `https://api.privy.io/v1/users?twitter_username=${twitterUsername.toLowerCase()}`,
    { headers }
  );

  if (!response.ok) return null;

  const data = await response.json();
  if (!data.data || data.data.length === 0) return null;

  // Find the user with matching Twitter handle (client-side filter)
  const normalized = twitterUsername.toLowerCase();
  const user = data.data.find(u =>
    u.linked_accounts?.some(
      a => a.type === 'twitter_oauth' &&
        (a.username?.toLowerCase() === normalized || a.subject === String(twitterId))
    )
  );

  return user || null;
}

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

    // ──────────────────────────────────────────────
    // Step 0: Check Supabase for existing wallet
    // ──────────────────────────────────────────────
    const sb = getSupabase();
    if (sb) {
      const normalized = twitterUsername.toLowerCase();
      const { data: existingUser } = await sb
        .from('users')
        .select('twitter_handle, hd_wallet, privy_wallet, privy_user_id')
        .ilike('twitter_handle', normalized)
        .maybeSingle();

      if (existingUser?.privy_wallet) {
        console.log('[create-x-wallet] Found existing Privy wallet in DB:', existingUser.privy_wallet);
        return Response.json({
          success: true,
          wallet: existingUser.privy_wallet,
          existing: true,
          source: 'supabase',
          userId: existingUser.privy_user_id,
          username: twitterUsername,
        });
      }

      // If user exists with HD wallet but no Privy wallet, note it
      if (existingUser?.hd_wallet) {
        console.log('[create-x-wallet] User has HD wallet but no Privy wallet:', existingUser.hd_wallet);
      }
    }

    // ──────────────────────────────────────────────
    // Step 1: Check Privy for existing user + wallet
    // ──────────────────────────────────────────────
    console.log('[create-x-wallet] Checking Privy for existing user:', twitterUsername);

    const existingUser = await findExistingPrivyUser(twitterUsername, twitterId);

    if (existingUser) {
      const userId = existingUser.id;
      console.log('[create-x-wallet] Found existing Privy user:', userId);

      // Check if they already have an embedded wallet
      const wallet = existingUser.linked_accounts?.find(
        a => a.type === 'wallet' && a.wallet_client === 'privy'
      );

      if (wallet) {
        console.log('[create-x-wallet] User already has wallet:', wallet.address);

        // Update Supabase with Privy wallet if not already stored
        if (sb) {
          await sb
            .from('users')
            .upsert({
              twitter_handle: twitterUsername.toLowerCase(),
              privy_wallet: wallet.address,
              privy_user_id: userId,
              twitter_id: String(twitterId),
            }, { onConflict: 'twitter_handle', ignoreDuplicates: false })
            .then(res => {
              if (res.error) console.log('[create-x-wallet] Supabase upsert note:', res.error.message);
            });
        }

        return Response.json({
          success: true,
          wallet: wallet.address,
          existing: true,
          source: 'privy',
          userId,
          username: twitterUsername,
        });
      }

      // User exists but no wallet — create one
      console.log('[create-x-wallet] Existing user has no wallet, creating...');
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
        throw new Error(`Failed to create wallet: ${error}`);
      }

      const walletData = await walletResponse.json();
      console.log('[create-x-wallet] ✅ Wallet created for existing user:', walletData.address);

      // Update Supabase
      if (sb) {
        await sb.from('users').upsert({
          twitter_handle: twitterUsername.toLowerCase(),
          privy_wallet: walletData.address,
          privy_user_id: userId,
          twitter_id: String(twitterId),
        }, { onConflict: 'twitter_handle', ignoreDuplicates: false });
      }

      return Response.json({
        success: true,
        wallet: walletData.address,
        walletId: walletData.id,
        userId,
        username: twitterUsername,
        signers: walletData.additional_signers,
      });
    }

    // ──────────────────────────────────────────────
    // Step 2: Create new user + wallet
    // ──────────────────────────────────────────────
    console.log('[create-x-wallet] Creating new user for:', twitterUsername);
    const userResponse = await fetch('https://api.privy.io/v1/users', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        linked_accounts: [{
          type: 'twitter_oauth',
          subject: String(twitterId),
          username: twitterUsername,
          name: twitterName || twitterUsername,
        }],
      }),
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      throw new Error(`Failed to create user: ${error}`);
    }

    const userData = await userResponse.json();
    const userId = userData.id;
    console.log('[create-x-wallet] Created user:', userId);

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
      throw new Error(`Failed to create wallet: ${error}`);
    }

    const walletData = await walletResponse.json();
    console.log('[create-x-wallet] ✅ New wallet created:', walletData.address);

    // Update Supabase
    if (sb) {
      await sb.from('users').upsert({
        twitter_handle: twitterUsername.toLowerCase(),
        privy_wallet: walletData.address,
        privy_user_id: userId,
        twitter_id: String(twitterId),
        display_name: twitterName || twitterUsername,
        wallet_type: 'privy',
      }, { onConflict: 'twitter_handle', ignoreDuplicates: false });
    }

    return Response.json({
      success: true,
      wallet: walletData.address,
      walletId: walletData.id,
      userId,
      username: twitterUsername,
      signers: walletData.additional_signers,
      new: true,
    });

  } catch (error) {
    console.error('[create-x-wallet] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
