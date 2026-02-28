/**
 * API Route: /api/ipfs/unpin
 * Unpin files from IPFS via Pinata
 */

import { NextResponse } from 'next/server';
import { PinataClient } from '@/lib/pinata';

/**
 * POST /api/ipfs/unpin
 * Unpin a CID from Pinata
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { cid, wallet } = body;

    if (!cid) {
      return NextResponse.json({ error: 'CID required' }, { status: 400 });
    }

    // Get Pinata credentials from environment
    const apiKey = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY || process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 });
    }

    const pinata = new PinataClient(apiKey, secretKey);

    // Verify the pin exists and optionally check ownership via metadata
    const pinDetails = await pinata.getPinByHash(cid);
    
    if (!pinDetails) {
      return NextResponse.json({ 
        success: true, 
        message: 'CID not found or already unpinned' 
      });
    }

    // Unpin the file
    const result = await pinata.unpinFile(cid);

    // Optionally update Supabase tracking
    if (wallet) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Mark as unpinned in tracking table
          await supabase
            .from('collection_ipfs')
            .update({ status: 'unpinned', updated_at: new Date().toISOString() })
            .or(`images_cid.eq.${cid},metadata_cid.eq.${cid}`)
            .eq('user_wallet', wallet.toLowerCase());
        }
      } catch (e) {
        console.error('Failed to update tracking:', e);
      }
    }

    return NextResponse.json({ 
      success: true,
      cid,
      alreadyUnpinned: result.alreadyUnpinned || false,
    });
  } catch (error) {
    console.error('POST /api/ipfs/unpin error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
