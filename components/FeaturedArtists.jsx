'use client';

import { useEffect, useState, useRef } from 'react';

export default function FeaturedArtists() {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [creations, setCreations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch featured creations from API (filtered by permission list)
  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch('/api/featured-artists');
        const data = await res.json();
        if (data.success && data.creations?.length > 0) {
          setCreations(data.creations);
        }
      } catch (error) {
        console.error('Failed to fetch featured artists:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  // Auto-scroll animation
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || creations.length === 0) return;

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
  }, [isPaused, creations]);

  if (isLoading) {
    return (
      <section className="border-y border-gray-800 py-6">
        <div className="container mx-auto px-4">
          <div className="h-48 bg-gray-900/50 rounded-lg animate-pulse" />
        </div>
      </section>
    );
  }

  if (creations.length === 0) {
    return null;
  }

  // Only duplicate for seamless loop if we have 2+ items
  // With 1 item, no need for infinite scroll effect
  const items = creations.length >= 2 
    ? [...creations, ...creations] 
    : creations;

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
              
              {/* Artist with link */}
              <div className="flex items-center justify-between">
                <a 
                  href={`https://x.com/${item.artist}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gan-yellow text-sm font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{item.artist}
                </a>
                <span className="text-gray-500 text-xs">↗</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
