import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy init Supabase with fallback env vars
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';
  return createClient(url, key);
}

// POST - Upload avatar to IPFS and save to Supabase
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const collectionAddress = formData.get('collectionAddress');
    const creatorWallet = formData.get('creatorWallet');
    const existingCid = formData.get('existingCid'); // If user entered a CID directly

    if (!collectionAddress) {
      return NextResponse.json({ error: 'Collection address required' }, { status: 400 });
    }

    let ipfsCid = existingCid;

    // Upload file to Pinata if provided
    if (file && file.size > 0) {
      const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || process.env.PINATA_API_KEY;
      const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || process.env.PINATA_SECRET_KEY;

      if (!apiKey || !secretKey) {
        return NextResponse.json({ error: 'Pinata API keys not configured' }, { status: 500 });
      }

      // Create form data for Pinata
      const pinataForm = new FormData();
      pinataForm.append('file', file);
      
      const metadata = JSON.stringify({
        name: `${collectionAddress}-avatar`,
      });
      pinataForm.append('pinataMetadata', metadata);

      const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': secretKey,
        },
        body: pinataForm,
      });

      if (!pinataRes.ok) {
        const errText = await pinataRes.text();
        console.error('Pinata error:', errText);
        return NextResponse.json({ error: `Failed to upload to IPFS: ${pinataRes.status}` }, { status: 500 });
      }

      const pinataData = await pinataRes.json();
      ipfsCid = pinataData.IpfsHash;
    }

    if (!ipfsCid) {
      return NextResponse.json({ error: 'No file or CID provided' }, { status: 400 });
    }

    // Build avatar URL
    const avatarUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;

    // Save to Supabase
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('collection_avatars')
      .upsert({
        collection_address: collectionAddress.toLowerCase(),
        avatar_url: avatarUrl,
        ipfs_cid: ipfsCid,
        creator_wallet: creatorWallet?.toLowerCase() || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'collection_address' })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        error: `Failed to save to database: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      ipfsCid,
      avatarUrl,
      data 
    });
  } catch (e) {
    console.error('Upload avatar error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
