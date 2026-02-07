'use client';

import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';

export default function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  return (
    <header className="border-b border-gray-800 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3">
          <img
            src="https://raw.githubusercontent.com/GanlandNFT/ganland-brand-kit/main/logos/gan-logo-primary.jpg"
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
          {ready && !authenticated && (
            <button
              onClick={login}
              className="px-4 py-2 bg-gan-yellow text-black font-bold rounded hover:bg-gan-gold transition-colors"
            >
              Connect Wallet
            </button>
          )}
          
          {ready && authenticated && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {user?.twitter?.username ? `@${user.twitter.username}` : 
                 user?.email?.address?.slice(0, 10) + '...' ||
                 user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)}
              </span>
              <button
                onClick={logout}
                className="px-3 py-1 border border-gan-yellow text-gan-yellow rounded hover:bg-gan-yellow hover:text-black transition-colors text-sm"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
