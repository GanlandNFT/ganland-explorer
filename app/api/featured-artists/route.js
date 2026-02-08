import { NextResponse } from 'next/server';

// Permission list of featured artists (fetched from database in production)
const PERMISSION_LIST = [
  'IGLIVISION',
  'artfractalicia', 
  '333nft',
  'techwiseconcept',
  'beforeday1',
  'd3throot',
  '0xskinny01',
  'seanvikson',
  '0xericbrown'
];

// Curated featured creations - all from artists on permission list
// In production, this would be fetched from Supabase with permission filtering
const FEATURED_CREATIONS = [
  {
    id: 1,
    image: 'https://pbs.twimg.com/media/HAmqIYpaoAAseCs.jpg',
    quote: "Here's your solarpunk Base city! A futuristic vision where technology meets nature 🌿⚡",
    artist: 'IGLIVISION',
    tweetUrl: 'https://x.com/GanlandNFT/status/2020332972516471211',
  },
  {
    id: 2,
    image: 'https://pbs.twimg.com/media/Gf_xN5RacAAqVRH.jpg',
    quote: "Fractal lobster emerging from the cosmic chaos 🦞✨",
    artist: '333nft',
    tweetUrl: 'https://x.com/GanlandNFT/status/1885748459572592854',
  },
  {
    id: 3,
    image: 'https://pbs.twimg.com/media/GfsLJHXaEAESsGn.jpg',
    quote: "Ethereal fractal eye emerging from holographic patterns 👁️🎨",
    artist: 'artfractalicia',
    tweetUrl: 'https://x.com/GanlandNFT/status/1884660287891517789',
  },
  {
    id: 4,
    image: 'https://pbs.twimg.com/media/GfqPmS0akAAoq_D.jpg',
    quote: "Mystical digital phoenix rising from fractal flames 🔥",
    artist: 'techwiseconcept',
    tweetUrl: 'https://x.com/GanlandNFT/status/1884419428260421825',
  },
];

export async function GET() {
  try {
    // Filter to only include artists from permission list
    const filteredCreations = FEATURED_CREATIONS.filter(
      creation => PERMISSION_LIST.includes(creation.artist)
    );

    return NextResponse.json({
      success: true,
      permissionList: PERMISSION_LIST,
      creations: filteredCreations,
    });
  } catch (error) {
    console.error('Failed to fetch featured artists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch featured artists' },
      { status: 500 }
    );
  }
}
