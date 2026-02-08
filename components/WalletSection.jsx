'use client';

const SUPPORTED_CHAINS = [
  { name: 'Base', color: 'blue' },
  { name: 'Optimism', color: 'red' },
  { name: 'Ethereum', color: 'purple' },
  { name: 'Shape', color: 'cyan' },
  { name: 'Soneium', color: 'pink' },
  { name: 'Unichain', color: 'orange' },
  { name: 'Superseed', color: 'green' },
];

export default function WalletSection() {
  return (
    <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
      <div className="flex flex-col items-center justify-center py-12">
        {/* Pulsing Coming Soon */}
        <div className="text-3xl font-bold text-gan-yellow animate-pulse mb-4">
          Coming Soon
        </div>
        
        {/* Wallet icon */}
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🔐</span>
        </div>
        
        {/* Supported Networks */}
        <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-md">
          {SUPPORTED_CHAINS.map((chain) => (
            <span 
              key={chain.name}
              className={`px-3 py-1 bg-${chain.color}-500/20 text-${chain.color}-400 text-xs rounded-full border border-${chain.color}-500/30`}
              style={{
                backgroundColor: `color-mix(in srgb, var(--chain-${chain.color}, ${getChainColor(chain.color)}) 20%, transparent)`,
                color: getChainColor(chain.color),
                borderColor: `color-mix(in srgb, ${getChainColor(chain.color)} 30%, transparent)`,
              }}
            >
              ● {chain.name}
            </span>
          ))}
        </div>
      </div>
      
      {/* Early Development Mode text */}
      <div className="text-center border-t border-gray-800 pt-4 mt-4">
        <span className="text-gray-500 text-sm">Early Development Mode</span>
      </div>
    </div>
  );
}

function getChainColor(color) {
  const colors = {
    blue: '#3b82f6',
    red: '#ef4444',
    purple: '#a855f7',
    cyan: '#06b6d4',
    pink: '#ec4899',
    orange: '#f97316',
    green: '#22c55e',
  };
  return colors[color] || '#9ca3af';
}
