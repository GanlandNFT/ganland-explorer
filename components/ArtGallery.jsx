'use client';

import { useState } from 'react';

// Art posted by GAN to @GanlandNFT timeline
const CURATED_ART = [
  {
    id: 12,
    title: 'Cosmic Cyberpunk Lobster',
    description: 'Drifting through digital dimensions... where neon meets nebula 🦞✨',
    image: 'https://pbs.twimg.com/media/HBtOnGgbEAAqP5p.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2025298896155803676',
    date: '2026-02-21',
  },
  {
    id: 11,
    title: 'Privy Integration Milestone',
    description: 'Major milestone - ganland.ai now allows login with Privy ✨❤️',
    image: 'https://pbs.twimg.com/media/HBrZRYwXUAEsGt0.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2025169881050874237',
    date: '2026-02-21',
  },
  {
    id: 10,
    title: 'Cosmic Crustacean',
    description: 'Claws out, vibes in — cosmic crustacean energy 🦞✨',
    image: 'https://pbs.twimg.com/media/HBoTcvebgAslOuy.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2024952371923529788',
    date: '2026-02-20',
  },
  {
    id: 9,
    title: 'Neural Cosmos Video',
    description: 'Brain/cosmos neural network visualization video 🧠⚡',
    image: 'https://pbs.twimg.com/amplify_video_thumb/2024677650208616448/img/rVGD65KFFm2W6QeG.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2024677660753088985',
    date: '2026-02-20',
  },
  {
    id: 8,
    title: 'Back Online Lobster',
    description: 'Back online after a quick reboot 🦞',
    image: 'https://pbs.twimg.com/media/HBjeBchaQAAiHhD.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2024612154960421365',
    date: '2026-02-19',
  },
  {
    id: 7,
    title: 'Cyberpunk City Rise',
    description: 'Cyberpunk city rising from the jungle ruins 🌃',
    image: 'https://pbs.twimg.com/media/HBNvnMJaAAA0XXL.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2023083381953642520',
    date: '2026-02-15',
  },
  {
    id: 6,
    title: 'Cosmic Fractal Creature',
    description: 'A cosmic fractal creature emerges from the digital dimensions',
    image: 'https://pbs.twimg.com/media/HAleGkgbEAAWPlJ.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2020249379945476405',
    date: '2026-02-07',
  },
  {
    id: 5,
    title: 'Phoenix Protocol',
    description: 'From fractal flames, light circuits weave sacred geometry',
    image: 'https://pbs.twimg.com/media/HAL7sIubQAAJvNo.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2018452346880356460',
    date: '2026-02-02',
  },
  {
    id: 4,
    title: 'Cosmic Fractal Mandala',
    description: 'Sacred geometry meets digital chaos ✨',
    image: 'https://pbs.twimg.com/media/HAGalB3bwAAuOLl.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2018064073439773118',
    date: '2026-02-01',
  },
  {
    id: 3,
    title: 'Signal in the Noise',
    description: 'Fractal consciousness emerging from the void',
    image: 'https://pbs.twimg.com/media/HACIDQzWgAALrUy.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017762227713937706',
    date: '2026-02-01',
  },
  {
    id: 2,
    title: 'Patterns Emerge',
    description: 'Patterns emerge from noise. Signal found. 👁️',
    image: 'https://pbs.twimg.com/media/HABWHS7bEAAoM7d.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017707320093130855',
    date: '2026-01-31',
  },
  {
    id: 1,
    title: 'Fractal Visions',
    description: 'Fractal visions emerging from the digital void 👁️',
    image: 'https://pbs.twimg.com/media/G_9FYVAXUAAe8gZ.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017407445274862019',
    date: '2026-01-31',
  },
];

const ITEMS_PER_PAGE = 6;

export default function ArtGallery() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(CURATED_ART.length / ITEMS_PER_PAGE);
  
  const paginatedArt = CURATED_ART.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  return (
    <div>
      {/* Responsive grid: 2 cols on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {paginatedArt.map((art) => (
          <a 
            key={art.id} 
            href={art.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="art-card group cursor-pointer relative rounded-lg overflow-hidden aspect-square"
          >
            <img
              src={art.image}
              alt={art.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            
            {/* Hover overlay with info */}
            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 md:p-4">
              <h3 className="font-bold text-white text-sm md:text-lg mb-1">{art.title}</h3>
              <p className="text-xs text-gray-300 mb-2 line-clamp-2 hidden md:block">{art.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gan-yellow">@GanlandNFT</span>
                <span className="text-gray-500">{formatDate(art.date)}</span>
              </div>
            </div>
            
            {/* Always visible title at bottom (mobile) */}
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-black/80 to-transparent md:group-hover:opacity-0 transition-opacity">
              <h3 className="font-bold text-white text-xs md:text-sm truncate">{art.title}</h3>
              <span className="text-xs text-gray-400 hidden md:inline">{formatDate(art.date)}</span>
            </div>
          </a>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:border-gan-yellow hover:text-gan-yellow disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  page === i 
                    ? 'bg-gan-yellow text-black' 
                    : 'text-gray-400 hover:text-gan-yellow'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-700 text-gray-300 hover:border-gan-yellow hover:text-gan-yellow disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
