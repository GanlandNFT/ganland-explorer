import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy init Supabase with fallback env vars
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
  
  if (!key) {
    console.error('No Supabase service key found in environment');
  }
  
  return createClient(url, key);
}

// GET - fetch avatar for a collection
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Collection address required' }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('collection_avatars')
    .select('avatar_url, ipfs_cid')
    .eq('collection_address', address.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error fetching avatar:', error);
    return NextResponse.json({ avatar: null });
  }

  return NextResponse.json({ 
    avatar: data?.avatar_url || (data?.ipfs_cid ? `https://gateway.pinata.cloud/ipfs/${data.ipfs_cid}` : null)
  });
}

// POST - store avatar for a collection
export async function POST(request) {
  try {
    const body = await request.json();
    const { collectionAddress, avatarUrl, ipfsCid, creatorWallet } = body;

    if (!collectionAddress) {
      return NextResponse.json({ error: 'Collection address required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Build avatar URL from CID if not provided
    const finalAvatarUrl = avatarUrl || (ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : null);

    const { data, error } = await supabase
      .from('collection_avatars')
      .upsert({
        collection_address: collectionAddress.toLowerCase(),
        avatar_url: finalAvatarUrl,
        ipfs_cid: ipfsCid || null,
        creator_wallet: creatorWallet?.toLowerCase() || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'collection_address' })
      .select()
      .single();

    if (error) {
      console.error('Error storing avatar:', error);
      return NextResponse.json({ 
        error: `Failed to store avatar: ${error.message || error.code || 'Unknown error'}`,
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('POST avatar error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
