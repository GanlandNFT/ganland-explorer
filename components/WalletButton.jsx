'use client';

import { usePrivy } from '@privy-io/react-auth';

// Simplified wallet button - X handle shown in WalletSection
export default function WalletButton() {
  const { ready, authenticated, login, logout } = usePrivy();

  // Still initializing
  if (!ready) {
    return (
      <button
        disabled
        className="px-3 py-2 bg-gray-700 text-gray-400 font-bold rounded-lg border border-gray-600 cursor-wait text-sm"
      >
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="hidden sm:inline">Connecting...</span>
        </span>
      </button>
    );
  }

  // Not logged in - show Connect button
  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-all duration-200 shadow-lg hover:shadow-gan-yellow/30 text-sm sm:text-base whitespace-nowrap"
      >
        <span className="sm:hidden">Connect</span>
        <span className="hidden sm:inline">Connect Wallet</span>
      </button>
    );
  }

  // Logged in - show simple Disconnect button
  return (
    <button
      onClick={logout}
      className="px-4 py-2 bg-transparent text-gan-yellow font-bold rounded-lg border border-gan-yellow hover:bg-gan-yellow hover:text-black transition-all duration-200 text-sm"
    >
      Disconnect
    </button>
  );
}
