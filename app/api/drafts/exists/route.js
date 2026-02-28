/**
 * API Route: /api/drafts/exists
 * Quick check if draft exists for a wallet
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ exists: false });
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ exists: false });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { count, error } = await supabase
      .from('launch_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('user_wallet', wallet.toLowerCase());

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ 
      exists: count > 0,
    });
  } catch (error) {
    console.error('GET /api/drafts/exists error:', error);
    return NextResponse.json({ exists: false });
  }
}
