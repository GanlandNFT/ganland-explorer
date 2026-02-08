'use client';

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
        
        {/* Chain badges */}
        <div className="flex gap-3 mb-6">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
            ● Base
          </span>
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
            ● Optimism
          </span>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
            ● Ethereum
          </span>
        </div>
      </div>
      
      {/* Early Development Mode text */}
      <div className="text-center border-t border-gray-800 pt-4 mt-4">
        <span className="text-gray-500 text-sm">Early Development Mode</span>
      </div>
    </div>
  );
}
