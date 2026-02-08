import { NextResponse } from 'next/server';

const ZAPPER_API_KEY = process.env.ZAPPER_API_KEY || 'b747e0f4-576a-4cac-800b-301bb06d15a4';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const network = searchParams.get('network') || 'OPTIMISM_MAINNET';

  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  try {
    // Try Zapper GraphQL
    const query = `
      query {
        nftCollections(collections: [{ 
          collectionAddress: "${address}", 
          network: ${network} 
        }]) {
          name
          medias {
            logo { url }
            banner { url }
          }
        }
      }
    `;

    const res = await fetch('https://public.zapper.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-zapper-api-key': ZAPPER_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    
    if (data?.data?.nftCollections?.[0]?.medias) {
      const medias = data.data.nftCollections[0].medias;
      const image = medias.logo?.url || medias.banner?.url;
      
      if (image) {
        return NextResponse.json({ 
          success: true, 
          image,
          source: 'zapper'
        });
      }
    }

    return NextResponse.json({ 
      success: false, 
      error: 'No image found' 
    });

  } catch (error) {
    console.error('Zapper API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
