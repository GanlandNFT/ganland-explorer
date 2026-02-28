import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
);

// GET /api/drafts?wallet=0x...
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }
  
  const { data, error } = await supabase
    .from('launch_drafts')
    .select('*')
    .eq('wallet_address', wallet)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ draft: data || null });
}

// POST /api/drafts - Save/update draft
export async function POST(request) {
  try {
    const body = await request.json();
    const { wallet, collectionName, description, uploadMode, config, step, stagedFiles } = body;
    
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('launch_drafts')
      .upsert({
        wallet_address: wallet.toLowerCase(),
        collection_name: collectionName,
        description,
        upload_mode: uploadMode || 'images',
        launch_config: config || {},
        current_step: step || 1,
        staged_files: stagedFiles || [],
        status: 'draft',
      }, {
        onConflict: 'wallet_address',
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ draft: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/drafts?wallet=0x...
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  
  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }
  
  const { error } = await supabase
    .from('launch_drafts')
    .delete()
    .eq('wallet_address', wallet);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
