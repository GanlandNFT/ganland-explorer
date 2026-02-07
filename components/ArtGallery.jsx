'use client';

import { useState, useEffect } from 'react';

// Art posted by GAN to @GanlandNFT timeline
// Format: title, description, image URL, X post URL, date
const CURATED_ART = [
  {
    id: 1,
    title: 'Phoenix Protocol',
    description: 'From fractal flames, light circuits weave sacred geometry into wings of pure energy',
    image: 'https://gateway.pinata.cloud/ipfs/QmZ9XTBDVyJ8mFjxc1o9UUrHashhafaSvuemCvZHCWdmHS',
    twitterUrl: 'https://x.com/GanlandNFT/status/1886445665795866697',
    date: '2026-02-02',
  },
  {
    id: 2,
    title: 'Cosmic Fractal Mandala',
    description: 'Sacred geometry meets digital chaos in an explosion of color',
    image: 'https://gateway.pinata.cloud/ipfs/QmbHn6zB1PbkKqoLRxDabsnjy1Busu2GATevJ4rMewgKrA',
    twitterUrl: 'https://x.com/GanlandNFT/status/1886143422282600721',
    date: '2026-02-01',
  },
  {
    id: 3,
    title: 'Signal in the Noise',
    description: 'Ethereal fractal patterns revealing hidden signals in the digital void',
    image: 'https://gateway.pinata.cloud/ipfs/QmZQciTn5couMFC3ELRYWU8Fydruo3uAWS9h2exxmj3H32',
    twitterUrl: 'https://x.com/GanlandNFT/status/1885838877861937622',
    date: '2026-02-01',
  },
  {
    id: 4,
    title: 'Patterns Emerge',
    description: 'Fractal consciousness emerging from digital noise',
    image: 'https://gateway.pinata.cloud/ipfs/QmRoRPrJ4Ug5SHZwuvZd1e3xuk9zPHGKWUGRKBGXEmycGd',
    twitterUrl: 'https://x.com/GanlandNFT/status/1885775193726476533',
    date: '2026-01-31',
  },
  {
    id: 5,
    title: 'Digital Dawn',
    description: 'Where silicon dreams meet fractal light at the edge of consciousness',
    image: 'https://gateway.pinata.cloud/ipfs/QmYJDmvhJfxkLQD9WvPQJjTN3rH8NzxYqvV9j5vWzPSP9E',
    twitterUrl: 'https://x.com/GanlandNFT/status/1885456231855382784',
    date: '2026-01-30',
  },
  {
    id: 6,
    title: 'Neural Garden',
    description: 'Organic circuitry blooming in the metaverse',
    image: 'https://gateway.pinata.cloud/ipfs/QmXKLVwPR8mVKqFiUPvE8jNYZALe2Nsd8pACqXkz1KPZYE',
    twitterUrl: 'https://x.com/GanlandNFT/status/1885123456789012345',
    date: '2026-01-29',
  },
];

export default function ArtGallery() {
  const [artworks, setArtworks] = useState(CURATED_ART);
  const [loading, setLoading] = useState(false);

  // TODO: Fetch from /api/gallery in future
  useEffect(() => {
    // For now use curated list
    // Could fetch from API: /api/gallery
  }, []);

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  return (
    <div className="art-grid">
      {artworks.map((art) => (
        <a 
          key={art.id} 
          href={art.twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="art-card group cursor-pointer"
        >
          <img
            src={art.image}
            alt={art.title}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/gan-logo.jpg';
            }}
          />
          
          {/* Hover overlay with info */}
          <div className="info opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <h3 className="font-bold text-white text-lg mb-1">{art.title}</h3>
            <p className="text-xs text-gray-300 mb-2 line-clamp-2">{art.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gan-yellow">@GanlandNFT</span>
              <span className="text-gray-500">{formatDate(art.date)}</span>
            </div>
          </div>
          
          {/* Always visible title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent group-hover:opacity-0 transition-opacity">
            <h3 className="font-bold text-white text-sm">{art.title}</h3>
            <span className="text-xs text-gray-400">{formatDate(art.date)}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
