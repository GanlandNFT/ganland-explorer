'use client';

import dynamic from 'next/dynamic';

// Dynamically import WalletButton with no SSR - only renders after Privy is ready
const WalletButton = dynamic(() => import('./WalletButton'), {
  ssr: false,
  loading: () => (
    <div className="w-32 h-9 bg-gray-800 rounded animate-pulse" />
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
          <a href="#gallery" className="hover:text-gan-yellow transition-colors">Art Gallery</a>
          <a href="https://ganland.io" target="_blank" className="hover:text-gan-yellow transition-colors">About</a>
        </nav>

        {/* Wallet Connect */}
        <div className="flex items-center gap-4">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
