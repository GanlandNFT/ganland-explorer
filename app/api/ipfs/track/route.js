/**
 * API Route: /api/ipfs/track
 * Track IPFS pins in Supabase for user management
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /api/ipfs/track
 * Track a new IPFS pin for a user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { wallet, collectionAddress, imagesCid, metadataCid, baseUri } = body;

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('collection_ipfs')
      .insert({
        user_wallet: wallet.toLowerCase(),
        collection_address: collectionAddress?.toLowerCase() || null,
        images_cid: imagesCid || null,
        metadata_cid: metadataCid || null,
        base_uri: baseUri || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to track pin' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tracking: data });
  } catch (error) {
    console.error('POST /api/ipfs/track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/ipfs/track
 * Update CID for a collection (e.g., after correction)
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { wallet, collectionAddress, newMetadataCid, newBaseUri } = body;

    if (!wallet || !collectionAddress) {
      return NextResponse.json({ error: 'Wallet and collection address required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (newMetadataCid) updateData.metadata_cid = newMetadataCid;
    if (newBaseUri) updateData.base_uri = newBaseUri;

    const { data, error } = await supabase
      .from('collection_ipfs')
      .update(updateData)
      .eq('user_wallet', wallet.toLowerCase())
      .eq('collection_address', collectionAddress.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 });
    }

    return NextResponse.json({ success: true, tracking: data });
  } catch (error) {
    console.error('PUT /api/ipfs/track error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
