import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return Response.json({ error: 'Missing handle parameter' }, { status: 400 });
  }

  // Normalize handle (remove @ if present)
  const normalized = handle.toLowerCase().replace('@', '').trim();

  try {
    // Use Privy API to look up user by Twitter username
    const response = await fetch(
      `https://api.privy.io/v1/users?twitter_username=${normalized}`,
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(
            `${process.env.NEXT_PUBLIC_PRIVY_APP_ID}:${process.env.PRIVY_APP_SECRET}`
          ).toString('base64')}`,
          'privy-app-id': process.env.NEXT_PUBLIC_PRIVY_APP_ID,
        },
      }
    );

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return Response.json({ 
        error: 'User not found',
        handle: normalized 
      }, { status: 404 });
    }

    // Find the user with matching Twitter handle
    const user = data.data.find(u => 
      u.linked_accounts?.some(
        a => a.type === 'twitter_oauth' && 
        a.username?.toLowerCase() === normalized
      )
    );

    if (!user) {
      return Response.json({ 
        error: 'User not found',
        handle: normalized 
      }, { status: 404 });
    }

    // Get embedded wallet address
    const wallet = user.linked_accounts?.find(
      a => a.type === 'wallet' && a.wallet_client === 'privy'
    );

    if (!wallet?.address) {
      return Response.json({ 
        error: 'User has no wallet',
        handle: normalized 
      }, { status: 404 });
    }

    return Response.json({
      handle: normalized,
      address: wallet.address,
      displayName: user.linked_accounts?.find(a => a.type === 'twitter_oauth')?.name || normalized
    });

  } catch (e) {
    console.error('Lookup failed:', e);
    return Response.json({ 
      error: 'Lookup failed',
      message: e.message 
    }, { status: 500 });
  }
}
