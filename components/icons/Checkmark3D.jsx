'use client';

/**
 * 3D-style animated checkmark for success states
 */
export function Checkmark3D({ size = 96, className = '' }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.4) 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      
      {/* Main 3D checkmark */}
      <svg
        viewBox="0 0 100 100"
        className="relative z-10 drop-shadow-2xl"
        style={{ width: size, height: size }}
      >
        {/* Definitions for gradients */}
        <defs>
          {/* Circle gradient - 3D effect */}
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          
          {/* Circle highlight */}
          <linearGradient id="circleHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          
          {/* Check gradient */}
          <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
          
          {/* Drop shadow filter */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#15803d" floodOpacity="0.5" />
          </filter>
          
          {/* Inner shadow for depth */}
          <filter id="innerShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="#0f172a" floodOpacity="0.3" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>
        
        {/* Background shadow circle */}
        <circle 
          cx="50" 
          cy="52" 
          r="40" 
          fill="#15803d" 
          opacity="0.3"
        />
        
        {/* Main circle with 3D gradient */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="url(#circleGrad)"
          filter="url(#shadow)"
        />
        
        {/* Highlight arc for 3D depth */}
        <path
          d="M 20 35 Q 50 10 80 35"
          fill="none"
          stroke="url(#circleHighlight)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.6"
        />
        
        {/* Checkmark with animation */}
        <path
          d="M 28 52 L 42 66 L 72 36"
          fill="none"
          stroke="url(#checkGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#innerShadow)"
          className="animate-draw-check"
          style={{
            strokeDasharray: 80,
            strokeDashoffset: 0,
          }}
        />
        
        {/* Subtle inner ring for depth */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="none"
          stroke="#16a34a"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
      
      {/* Sparkle effects */}
      <div className="absolute top-0 right-2 text-yellow-300 animate-ping text-lg">✦</div>
      <div className="absolute bottom-2 left-0 text-cyan-300 animate-ping text-sm" style={{ animationDelay: '0.5s' }}>✦</div>
    </div>
  );
}

export default Checkmark3D;
