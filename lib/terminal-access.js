import { createClient } from '@supabase/supabase-js';

// Constants
const FREE_HANDLES = ['iglivision', 'artfractalicia'];
const REQUIRED_GAN = BigInt('6900000000000000000000000'); // 6,900,000 * 10^18
const GAN_TOKEN = '0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07';

// Supabase client (server-side)
function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
}

/**
 * Check if a user has terminal access
 * @param {string} xHandle - Twitter/X handle (lowercase)
 * @param {string} walletAddress - User's wallet address
 * @param {bigint} ganBalance - User's $GAN balance
 * @returns {Promise<{granted: boolean, reason: string, expires?: Date}>}
 */
export async function checkTerminalAccess(xHandle, walletAddress, ganBalance) {
  // 1. Check free list
  if (xHandle && FREE_HANDLES.includes(xHandle.toLowerCase())) {
    return {
      granted: true,
      reason: 'free_list',
      message: `Featured Artist (${xHandle})`
    };
  }

  // 2. Check $GAN balance
  if (ganBalance && BigInt(ganBalance) >= REQUIRED_GAN) {
    return {
      granted: true,
      reason: 'token_gate',
      message: `Token holder (${formatGan(ganBalance)} $GAN)`
    };
  }

  // 3. Check subscription in Supabase
  if (xHandle) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('expires_at')
        .eq('x_handle', xHandle.toLowerCase())
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return {
          granted: true,
          reason: 'subscription',
          expires: new Date(data.expires_at),
          message: `Subscriber (expires ${new Date(data.expires_at).toLocaleDateString()})`
        };
      }
    } catch (e) {
      console.error('Subscription check failed:', e);
    }
  }

  // No access
  return {
    granted: false,
    reason: 'insufficient',
    balance: ganBalance,
    required: REQUIRED_GAN.toString()
  };
}

/**
 * Log terminal access for analytics
 */
export async function logTerminalAccess(xHandle, walletAddress, accessType, ganBalance) {
  try {
    const supabase = getSupabase();
    await supabase.from('terminal_access_logs').insert({
      x_handle: xHandle?.toLowerCase(),
      wallet_address: walletAddress,
      access_type: accessType,
      gan_balance: ganBalance ? ganBalance.toString() : null
    });
  } catch (e) {
    console.error('Failed to log access:', e);
  }
}

/**
 * Create or update user record
 */
export async function upsertUser(xHandle, xId, walletAddress, privyUserId) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .upsert({
        x_handle: xHandle?.toLowerCase(),
        x_id: xId,
        wallet_address: walletAddress,
        privy_user_id: privyUserId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'x_handle'
      })
      .select()
      .single();

    return { data, error };
  } catch (e) {
    console.error('Failed to upsert user:', e);
    return { error: e };
  }
}

/**
 * Record subscription payment
 */
export async function recordSubscription(xHandle, txHash, amountEth, durationDays = 30) {
  try {
    const supabase = getSupabase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        x_handle: xHandle?.toLowerCase(),
        tx_hash: txHash,
        amount_eth: amountEth,
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    return { data, error };
  } catch (e) {
    console.error('Failed to record subscription:', e);
    return { error: e };
  }
}

/**
 * Verify ETH payment on-chain
 */
export async function verifyPayment(txHash, expectedAmount, recipientAddress) {
  // TODO: Implement on-chain verification using Alchemy
  // For now, return a placeholder
  return {
    verified: false,
    message: 'Payment verification not yet implemented'
  };
}

// Utility functions
function formatGan(balance) {
  const num = Number(balance) / 1e18;
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
  return num.toFixed(2);
}

export { FREE_HANDLES, REQUIRED_GAN, GAN_TOKEN };
