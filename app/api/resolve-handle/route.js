import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  let handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle required' }, { status: 400 });
  }

  // Remove @ if present
  handle = handle.replace(/^@/, '').toLowerCase();

  try {
    // Try multiple approaches to find the user
    // 1. Check x_handle (Twitter/X handle)
    let { data, error } = await supabase
      .from('users')
      .select('wallet_address, x_handle, username, privy_did')
      .or(`x_handle.ilike.${handle},username.ilike.${handle}`)
      .limit(1)
      .maybeSingle();

    if (!data) {
      // 2. Try with case-insensitive search on x_handle
      const { data: data2 } = await supabase
        .from('users')
        .select('wallet_address, x_handle, username, privy_did')
        .ilike('x_handle', handle)
        .limit(1)
        .maybeSingle();
      
      if (data2) data = data2;
    }

    if (!data) {
      // 3. Try partial match
      const { data: data3 } = await supabase
        .from('users')
        .select('wallet_address, x_handle, username, privy_did')
        .or(`x_handle.ilike.%${handle}%,username.ilike.%${handle}%`)
        .limit(1)
        .maybeSingle();
      
      if (data3) data = data3;
    }

    if (!data || !data.wallet_address) {
      return NextResponse.json({ 
        error: `Handle @${handle} not found in Ganland. User must have a Ganland account.`,
        searched: handle 
      }, { status: 404 });
    }

    return NextResponse.json({
      address: data.wallet_address,
      handle: data.x_handle || data.username || handle
    });
  } catch (e) {
    console.error('Resolve handle error:', e);
    return NextResponse.json({ 
      error: 'Failed to resolve handle',
      details: e.message 
    }, { status: 500 });
  }
}
