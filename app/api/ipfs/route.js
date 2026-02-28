import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PINATA_API_URL = 'https://api.pinata.cloud';

// Lazy-load Supabase to avoid build-time initialization
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

function getPinataHeaders() {
  return {
    'pinata_api_key': process.env.PINATA_API_KEY || '',
    'pinata_secret_api_key': process.env.PINATA_SECRET_KEY || '',
  };
}

// GET /api/ipfs?wallet=0x... - List user's pins
export async function GET(request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }
  
  // Get from our tracking table
  const { data, error } = await supabase
    .from('user_ipfs_pins')
    .select('*')
    .eq('wallet_address', wallet)
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ pins: data || [] });
}

// POST /api/ipfs - Record a new pin
export async function POST(request) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const { wallet, cid, type, name, fileCount, sizeBytes } = body;
    
    if (!wallet || !cid) {
      return NextResponse.json({ error: 'Wallet and CID required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('user_ipfs_pins')
      .upsert({
        wallet_address: wallet.toLowerCase(),
        ipfs_cid: cid,
        pin_type: type || 'collection',
        collection_name: name,
        file_count: fileCount,
        pin_size_bytes: sizeBytes,
      }, {
        onConflict: 'wallet_address,ipfs_cid',
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ pin: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/ipfs?wallet=0x...&cid=Qm... - Unpin from IPFS
export async function DELETE(request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  const cid = searchParams.get('cid');
  
  if (!wallet || !cid) {
    return NextResponse.json({ error: 'Wallet and CID required' }, { status: 400 });
  }
  
  // Verify ownership
  const { data: pin } = await supabase
    .from('user_ipfs_pins')
    .select('id')
    .eq('wallet_address', wallet)
    .eq('ipfs_cid', cid)
    .single();
  
  if (!pin) {
    return NextResponse.json({ error: 'Pin not found or not owned by wallet' }, { status: 404 });
  }
  
  // Unpin from Pinata
  try {
    const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
      method: 'DELETE',
      headers: getPinataHeaders(),
    });
    
    // 404 means already unpinned, which is fine
    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Pinata unpin failed');
    }
  } catch (err) {
    // Log but continue - we'll still remove from our tracking
    console.error('Pinata unpin error:', err.message);
  }
  
  // Remove from our tracking
  await supabase
    .from('user_ipfs_pins')
    .delete()
    .eq('wallet_address', wallet)
    .eq('ipfs_cid', cid);
  
  return NextResponse.json({ success: true, unpinned: cid });
}
