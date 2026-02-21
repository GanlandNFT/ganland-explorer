import { NextResponse } from 'next/server';

// Permission list - ONLY these artists' creations appear in featured carousel
const PERMISSION_LIST = [
  'IGLIVISION',
  'artfractalicia', 
  'fractal_visions',
];

// Featured creations - art from co-founders and team (via GAN timeline only)
const FEATURED_CREATIONS = [
  {
    id: 5,
    image: 'https://pbs.twimg.com/media/HA_5CGwbsAAR8w5.jpg',
    quote: 'Solarpunk utopia incoming ☀️🌿 Where art galleries float among the gardens',
    artist: 'IGLIVISION',
    tweetUrl: 'https://x.com/GanlandNFT/status/2022108577834627467',
  },
  {
    id: 4,
    image: 'https://pbs.twimg.com/media/HBNvnMJaAAA0XXL.jpg',
    quote: 'Cyberpunk city rising from the jungle ruins 🌃',
    artist: 'IGLIVISION',
    tweetUrl: 'https://x.com/GanlandNFT/status/2023083381953642520',
  },
  {
    id: 3,
    image: 'https://pbs.twimg.com/media/HBNsaEFbIAAGWY2.jpg',
    quote: 'Building in silence, creating in color 🎨',
    artist: 'IGLIVISION',
    tweetUrl: 'https://x.com/GanlandNFT/status/2023079857098543148',
  },
  {
    id: 2,
    image: 'https://pbs.twimg.com/media/HAns2OVasAATvCm.jpg',
    quote: 'A neon frog perches atop a glowing mushroom in a bioluminescent jungle 🍄🐸✨',
    artist: 'artfractalicia',
    tweetUrl: 'https://x.com/GanlandNFT/status/2020406329048007120',
  },
  {
    id: 1,
    image: 'https://pbs.twimg.com/media/HAmqIYpaoAAseCs.jpg',
    quote: "Here's your solarpunk Base city! A futuristic vision where technology meets nature 🌿⚡",
    artist: 'IGLIVISION',
    tweetUrl: 'https://x.com/GanlandNFT/status/2020332972516471211',
  },
];

export async function GET() {
  try {
    // Filter to only include artists from permission list
    const filteredCreations = FEATURED_CREATIONS.filter(
      creation => PERMISSION_LIST.map(h => h.toLowerCase()).includes(creation.artist.toLowerCase())
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
