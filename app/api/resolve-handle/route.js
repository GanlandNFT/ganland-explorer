import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle');

  if (!handle) {
    return NextResponse.json({ error: 'Handle required' }, { status: 400 });
  }

  try {
    // Look up user by x_handle or username
    const { data, error } = await supabase
      .from('users')
      .select('wallet_address, x_handle, username')
      .or(`x_handle.ilike.${handle},username.ilike.${handle}`)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Handle not found' }, { status: 404 });
    }

    return NextResponse.json({
      address: data.wallet_address,
      handle: data.x_handle || data.username
    });
  } catch (e) {
    console.error('Resolve handle error:', e);
    return NextResponse.json({ error: 'Failed to resolve handle' }, { status: 500 });
  }
}
