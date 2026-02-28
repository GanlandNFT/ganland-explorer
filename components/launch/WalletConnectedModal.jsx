'use client';

import { useState, useEffect } from 'react';

/**
 * WalletConnectedModal - Shows briefly when user connects to launchpad
 * Features an animated 3D lock that closes before modal disappears
 */
export function WalletConnectedModal({ 
  isOpen, 
  walletAddress, 
  onComplete,
  duration = 3000 // 3 seconds total
}) {
  const [stage, setStage] = useState('open'); // open, closing, closed

  useEffect(() => {
    if (!isOpen) {
      setStage('open');
      return;
    }

    // Stage 1: Show open lock (1.5s)
    const closingTimer = setTimeout(() => {
      setStage('closing');
    }, duration * 0.5);

    // Stage 2: Lock closes animation (0.5s)
    const closedTimer = setTimeout(() => {
      setStage('closed');
    }, duration * 0.7);

    // Stage 3: Modal fades out and completes
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearTimeout(closingTimer);
      clearTimeout(closedTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, duration, onComplete]);

  if (!isOpen) return null;

  const truncatedAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '';

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity duration-500 ${
        stage === 'closed' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className={`bg-gray-900 rounded-2xl max-w-sm w-full p-8 relative border border-gray-700 shadow-2xl transform transition-all duration-500 ${
        stage === 'closed' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}>
        {/* 3D Animated Lock */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            {/* Glow effect */}
            <div 
              className={`absolute inset-0 rounded-full transition-all duration-700 ${
                stage === 'open' ? 'bg-yellow-500/20' : 'bg-green-500/30'
              }`}
              style={{ filter: 'blur(12px)' }}
            />
            
            {/* Lock SVG with 3D effect */}
            <svg 
              viewBox="0 0 100 100" 
              className="relative z-10 w-full h-full drop-shadow-2xl"
            >
              <defs>
                {/* Lock body gradient */}
                <linearGradient id="lockBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={stage === 'open' ? '#fbbf24' : '#22c55e'} />
                  <stop offset="50%" stopColor={stage === 'open' ? '#d97706' : '#16a34a'} />
                  <stop offset="100%" stopColor={stage === 'open' ? '#92400e' : '#15803d'} />
                </linearGradient>
                
                {/* Shackle gradient */}
                <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9ca3af" />
                  <stop offset="50%" stopColor="#6b7280" />
                  <stop offset="100%" stopColor="#4b5563" />
                </linearGradient>
                
                {/* Highlight */}
                <linearGradient id="highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Lock shackle (animated) */}
              <g className={`transition-transform duration-500 origin-bottom ${
                stage === 'open' ? 'translate-y-0 rotate-0' : '-translate-y-1'
              }`}>
                <path
                  d={stage === 'open' 
                    ? "M 35 40 L 35 30 C 35 15 50 10 50 10 C 50 10 65 15 65 30 L 65 40"  // Open shackle
                    : "M 35 40 L 35 25 C 35 12 65 12 65 25 L 65 40"  // Closed shackle
                  }
                  fill="none"
                  stroke="url(#shackleGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </g>
              
              {/* Lock body */}
              <rect 
                x="25" 
                y="40" 
                width="50" 
                height="40" 
                rx="6" 
                fill="url(#lockBodyGrad)"
              />
              
              {/* Lock body highlight */}
              <rect 
                x="28" 
                y="43" 
                width="44" 
                height="15" 
                rx="4" 
                fill="url(#highlight)"
              />
              
              {/* Keyhole */}
              <circle cx="50" cy="55" r="5" fill="#1f2937" />
              <rect x="47" y="55" width="6" height="12" rx="2" fill="#1f2937" />
              
              {/* Checkmark (appears when locked) */}
              {stage !== 'open' && (
                <path
                  d="M 40 58 L 47 65 L 62 48"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-check"
                  style={{
                    strokeDasharray: 40,
                    strokeDashoffset: stage === 'closed' ? 0 : 40,
                    transition: 'stroke-dashoffset 0.5s ease-out',
                  }}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="text-center">
          <h2 className={`text-xl font-bold mb-2 transition-colors duration-500 ${
            stage === 'open' ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {stage === 'open' ? 'Connecting...' : 'Wallet Connected!'}
          </h2>
          
          <p className="text-gray-400 text-sm mb-4">
            {stage === 'open' ? 'Verifying your wallet' : 'Ready to deploy'}
          </p>
          
          {/* Wallet address */}
          <div className="bg-gray-800/50 rounded-lg px-4 py-2 inline-block">
            <span className="font-mono text-cyan-400 text-sm">{truncatedAddress}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              stage === 'open' ? 'bg-yellow-500 w-1/2' : 
              stage === 'closing' ? 'bg-green-500 w-3/4' : 
              'bg-green-500 w-full'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default WalletConnectedModal;
