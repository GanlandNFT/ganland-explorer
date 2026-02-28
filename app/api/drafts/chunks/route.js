/**
 * API Route: /api/drafts/chunks
 * Handle large file chunk uploads
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
 * POST /api/drafts/chunks
 * Upload a single chunk
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { draftId, fileIndex, chunkIndex, chunkData } = body;

    if (!draftId || fileIndex === undefined || chunkIndex === undefined || !chunkData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('draft_file_chunks')
      .upsert({
        draft_id: draftId,
        file_index: fileIndex,
        chunk_index: chunkIndex,
        chunk_data: chunkData,
      }, {
        onConflict: 'draft_id,file_index,chunk_index',
      });

    if (error) {
      console.error('Chunk upload error:', error);
      return NextResponse.json({ error: 'Failed to upload chunk' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/drafts/chunks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
