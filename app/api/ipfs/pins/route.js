/**
 * API Route: /api/ipfs/pins
 * List pinned files from Pinata
 */

import { NextResponse } from 'next/server';
import { PinataClient } from '@/lib/pinata';

/**
 * GET /api/ipfs/pins?wallet=0x...&nameFilter=...
 * List pins, optionally filtered
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const nameFilter = searchParams.get('nameFilter');

    // Get Pinata credentials from environment
    const apiKey = process.env.PINATA_API_KEY || process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY || process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({ error: 'Pinata not configured' }, { status: 500 });
    }

    const pinata = new PinataClient(apiKey, secretKey);

    // List pins from Pinata
    const result = await pinata.listPins({
      status: 'pinned',
      pageLimit: 100,
      nameContains: nameFilter || '',
    });

    // If wallet provided, also fetch from Supabase tracking
    let trackedPins = [];
    if (wallet) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data } = await supabase
            .from('collection_ipfs')
            .select('*')
            .eq('user_wallet', wallet.toLowerCase())
            .eq('status', 'active');
          
          trackedPins = data || [];
        }
      } catch (e) {
        console.error('Failed to fetch tracking:', e);
      }
    }

    return NextResponse.json({
      pins: result.rows || [],
      count: result.count || 0,
      tracked: trackedPins,
    });
  } catch (error) {
    console.error('GET /api/ipfs/pins error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
