'use client';

import { useState, useEffect } from 'react';

// Art posted by GAN to @GanlandNFT timeline - using X CDN URLs
const CURATED_ART = [
  {
    id: 1,
    title: 'Solarpunk Base City',
    description: 'A futuristic vision where technology meets nature 🌿⚡',
    image: 'https://pbs.twimg.com/media/HAmqIYpaoAAseCs.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2020332972516471211',
    date: '2026-02-08',
  },
  {
    id: 2,
    title: 'Cosmic Fractal Creature',
    description: 'A cosmic fractal creature emerging from digital dimensions',
    image: 'https://pbs.twimg.com/media/HAleGkgbEAAWPlJ.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2020249379945476405',
    date: '2026-02-07',
  },
  {
    id: 3,
    title: 'Phoenix Protocol',
    description: 'From fractal flames, light circuits weave sacred geometry into wings',
    image: 'https://pbs.twimg.com/media/Gf9P5kkasAArJAK.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/1886445665795866697',
    date: '2026-02-02',
  },
  {
    id: 4,
    title: 'Cosmic Fractal Mandala',
    description: 'Sacred geometry meets digital chaos in an explosion of color',
    image: 'https://pbs.twimg.com/media/Gf5M8w9akAAn0Jx.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/1886143422282600721',
    date: '2026-02-01',
  },
  {
    id: 5,
    title: 'Signal in the Noise',
    description: 'Ethereal fractal patterns revealing hidden signals',
    image: 'https://pbs.twimg.com/media/Gf2P4MkaEAAI-2P.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/1885838877861937622',
    date: '2026-02-01',
  },
  {
    id: 6,
    title: 'Patterns Emerge',
    description: 'Fractal consciousness emerging from digital noise',
    image: 'https://pbs.twimg.com/media/Gf1VH5YaYAAKOuX.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/1885775193726476533',
    date: '2026-01-31',
  },
];

export default function ArtGallery() {
  const [artworks, setArtworks] = useState(CURATED_ART);

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
