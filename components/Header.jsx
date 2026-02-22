'use client';

import dynamic from 'next/dynamic';
import PrivyErrorBoundary from './PrivyErrorBoundary';

const WalletButton = dynamic(() => import('./WalletButton'), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-9 bg-gray-800 rounded-lg animate-pulse" />
  ),
});

export default function Header() {
  return (
    <header className="border-b border-gray-800 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <img
            src="/gan-logo.jpg"
            alt="GANLAND"
            className="w-10 h-10 rounded-lg"
          />
          <span className="text-2xl font-bold text-gan-yellow neon-glow">GANLAND</span>
        </a>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="hover:text-gan-yellow transition-colors">Home</a>
          <a href="#collections" className="hover:text-gan-yellow transition-colors">Collections</a>
          <a href="/docs" className="hover:text-gan-yellow transition-colors">Docs</a>
          <a href="/terminal" className="px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors">
            Terminal
          </a>
        </nav>

        {/* Wallet Connect */}
        <div className="flex items-center gap-4">
          <PrivyErrorBoundary 
            fallback={
              <button className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-wait">
                Loading...
              </button>
            }
          >
            <WalletButton />
          </PrivyErrorBoundary>
        </div>
      </div>
    </header>
  );
}
