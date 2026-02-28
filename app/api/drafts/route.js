/**
 * API Route: /api/drafts
 * Manages launch drafts in Supabase
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
 * GET /api/drafts?wallet=0x...
 * Load draft for a wallet
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get draft
    const { data: draft, error } = await supabase
      .from('launch_drafts')
      .select('*')
      .eq('user_wallet', wallet.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!draft) {
      return NextResponse.json({ error: 'No draft found' }, { status: 404 });
    }

    // Get any chunks for this draft
    const { data: chunks } = await supabase
      .from('draft_file_chunks')
      .select('file_index, chunk_index, chunk_data')
      .eq('draft_id', draft.id)
      .order('file_index')
      .order('chunk_index');

    return NextResponse.json({ draft, chunks: chunks || [] });
  } catch (error) {
    console.error('GET /api/drafts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/drafts
 * Save or update draft (upsert by wallet)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { wallet, draftData, stagedFiles } = body;

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const normalizedWallet = wallet.toLowerCase();

    // Upsert draft
    const { data: draft, error } = await supabase
      .from('launch_drafts')
      .upsert({
        user_wallet: normalizedWallet,
        draft_data: draftData || {},
        staged_files: stagedFiles || [],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_wallet',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    // Clear old chunks when saving new draft
    await supabase
      .from('draft_file_chunks')
      .delete()
      .eq('draft_id', draft.id);

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error('POST /api/drafts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/drafts?wallet=0x...
 * Delete draft for a wallet
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('launch_drafts')
      .delete()
      .eq('user_wallet', wallet.toLowerCase());

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/drafts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
