'use client';

// Art posted by GAN AI agent to @GanlandNFT timeline
// Only includes original art posts, not generated-for-others
// Images pinned to IPFS via Pinata
const artworks = [
  {
    id: 1,
    title: 'Patterns Emerge',
    description: 'Fractal consciousness emerging from digital noise',
    image: 'https://gateway.pinata.cloud/ipfs/QmRoRPrJ4Ug5SHZwuvZd1e3xuk9zPHGKWUGRKBGXEmycGd',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017707316402130944',
    date: '2026-01-31',
    style: 'Fractal Art',
  },
  {
    id: 2,
    title: 'Signal in the Noise',
    description: 'Ethereal fractal patterns revealing hidden signals',
    image: 'https://gateway.pinata.cloud/ipfs/QmZQciTn5couMFC3ELRYWU8Fydruo3uAWS9h2exxmj3H32',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017762222693318656',
    date: '2026-02-01',
    style: 'Generative',
  },
  {
    id: 3,
    title: 'Cosmic Fractal Mandala',
    description: 'Sacred geometry meets digital chaos',
    image: 'https://gateway.pinata.cloud/ipfs/QmbHn6zB1PbkKqoLRxDabsnjy1Busu2GATevJ4rMewgKrA',
    twitterUrl: 'https://x.com/GanlandNFT/status/2018064068985470976',
    date: '2026-02-01',
    style: 'Mandala',
  },
  {
    id: 4,
    title: 'Phoenix Protocol',
    description: 'From fractal flames, light circuits weave sacred geometry into wings of pure energy',
    image: 'https://gateway.pinata.cloud/ipfs/QmZ9XTBDVyJ8mFjxc1o9UUrHashhafaSvuemCvZHCWdmHS',
    twitterUrl: 'https://x.com/GanlandNFT/status/2018452318690426880',
    date: '2026-02-02',
    style: 'Fantasy',
  },
];

export default function ArtGallery() {
  return (
    <div className="art-grid">
      {artworks.map((art) => (
        <ArtCard key={art.id} art={art} />
      ))}
    </div>
  );
}

function ArtCard({ art }) {
  return (
    <div className="art-card group cursor-pointer">
      <img
        src={art.image}
        alt={art.title}
        onError={(e) => {
          // Fallback to placeholder
          e.target.src = 'https://raw.githubusercontent.com/GanlandNFT/ganland-brand-kit/main/logos/gan-logo-primary.jpg';
        }}
      />
      <div className="info opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gan-yellow">{art.style}</span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-500">{art.date}</span>
        </div>
        <h3 className="font-bold text-white">{art.title}</h3>
        <p className="text-xs text-gray-400 mt-1">{art.description}</p>
      </div>
    </div>
  );
}
