import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy-load Supabase client to avoid build-time initialization
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

// PUT /api/collections/update-cid - Update baseURI/CID for a deployed collection
export async function PUT(request) {
  const supabase = getSupabase();
  try {
    const body = await request.json();
    const { wallet, contractAddress, newImagesCid, newMetadataCid, newBaseUri } = body;
    
    if (!wallet || !contractAddress) {
      return NextResponse.json({ error: 'Wallet and contract address required' }, { status: 400 });
    }
    
    if (!newMetadataCid && !newBaseUri) {
      return NextResponse.json({ error: 'New CID or baseURI required' }, { status: 400 });
    }
    
    // Update the collection record
    const updates = {};
    if (newImagesCid) updates.ipfs_images_cid = newImagesCid;
    if (newMetadataCid) updates.ipfs_metadata_cid = newMetadataCid;
    if (newBaseUri) updates.ipfs_base_uri = newBaseUri;
    
    // Update in launch_drafts (if exists)
    await supabase
      .from('launch_drafts')
      .update(updates)
      .eq('wallet_address', wallet.toLowerCase());
    
    // Also update in collections table if it exists
    const { data, error } = await supabase
      .from('collections')
      .update({
        metadata: {
          ipfs_cid: newMetadataCid || newBaseUri?.replace('ipfs://', '').split('/')[0],
          updated_at: new Date().toISOString(),
        }
      })
      .eq('contract_address', contractAddress.toLowerCase())
      .select()
      .single();
    
    // Note: The actual on-chain baseURI update requires a contract call
    // This only updates our database records
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database records updated. Note: On-chain baseURI update requires contract owner to call setBaseURI()',
      updated: data || updates,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
