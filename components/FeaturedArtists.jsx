'use client';

import { useEffect, useState, useRef } from 'react';

// Featured art generations from permission list artists
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
  {
    id: 5,
    image: 'https://pbs.twimg.com/media/GfmqGZRagAANm8i.jpg',
    quote: "Mandelbrot mandala full of cosmic energy and sacred geometry ✨",
    artist: 'd3throot',
    tweetUrl: 'https://x.com/GanlandNFT/status/1884055123908337897',
  },
  {
    id: 6,
    image: 'https://pbs.twimg.com/media/GflJxCbakAA7Jqy.jpg',
    quote: "Abstract fractal mandala pulsing with digital life 🌀",
    artist: 'beforeday1',
    tweetUrl: 'https://x.com/GanlandNFT/status/1883894567406449124',
  },
];

export default function FeaturedArtists() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId;
    let scrollPos = 0;
    const scrollSpeed = 0.5; // pixels per frame

    const animate = () => {
      if (!isPaused) {
        scrollPos += scrollSpeed;
        // Reset when we've scrolled through half (since content is duplicated)
        if (scrollPos >= scrollContainer.scrollWidth / 2) {
          scrollPos = 0;
        }
        scrollContainer.scrollLeft = scrollPos;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Duplicate items for seamless loop
  const items = [...FEATURED_CREATIONS, ...FEATURED_CREATIONS];

  return (
    <section className="border-y border-gray-800 py-6 overflow-hidden">
      <div className="container mx-auto px-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          ✨ Featured Creations
        </h3>
      </div>
      
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-hidden px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {items.map((item, index) => (
          <a
            key={`${item.id}-${index}`}
            href={item.tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-72 bg-gray-900/50 rounded-lg border border-gray-800 hover:border-gan-yellow transition-all hover:scale-[1.02] overflow-hidden group"
          >
            {/* Image */}
            <div className="h-32 overflow-hidden">
              <img
                src={item.image}
                alt={`Art by @${item.artist}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            
            {/* Content */}
            <div className="p-3">
              {/* Quote */}
              <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                "{item.quote}"
              </p>
              
              {/* Artist */}
              <div className="flex items-center justify-between">
                <span className="text-gan-yellow text-sm font-medium hover:underline">
                  @{item.artist}
                </span>
                <span className="text-gray-500 text-xs">↗</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
