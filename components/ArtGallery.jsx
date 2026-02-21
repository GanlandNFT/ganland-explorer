'use client';

// Art posted by GAN to @GanlandNFT timeline
// These are GAN's own creations (NOT featured artist commissions)
const CURATED_ART = [
  {
    id: 1,
    title: 'Fractal Visions',
    description: 'Fractal visions emerging from the digital void 👁️',
    image: 'https://pbs.twimg.com/media/G_9FYVAXUAAe8gZ.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017407445274862019',
    date: '2026-01-31',
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
    id: 3,
    title: 'Signal in the Noise',
    description: 'Fractal consciousness emerging from the void',
    image: 'https://pbs.twimg.com/media/HACIDQzWgAALrUy.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2017762227713937706',
    date: '2026-02-01',
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
    id: 5,
    title: 'Phoenix Protocol',
    description: 'From fractal flames, light circuits weave sacred geometry',
    image: 'https://pbs.twimg.com/media/HAL7sIubQAAJvNo.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2018452346880356460',
    date: '2026-02-02',
  },
  {
    id: 6,
    title: 'Cosmic Fractal Creature',
    description: 'A cosmic fractal creature emerges from the digital dimensions',
    image: 'https://pbs.twimg.com/media/HAleGkgbEAAWPlJ.jpg',
    twitterUrl: 'https://x.com/GanlandNFT/status/2020249379945476405',
    date: '2026-02-07',
  },
];

export default function ArtGallery() {
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
      {CURATED_ART.map((art) => (
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
