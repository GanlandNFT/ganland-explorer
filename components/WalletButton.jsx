'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Still initializing
  if (!ready) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-700 text-gray-400 font-bold rounded-lg border border-gray-600 cursor-wait"
      >
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Connecting...
        </span>
      </button>
    );
  }

  // Not logged in
  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-5 py-2.5 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-all duration-200 shadow-lg hover:shadow-gan-yellow/30"
      >
        Connect Wallet
      </button>
    );
  }

  // Logged in - show user info
  const displayName = user?.twitter?.username 
    ? `@${user.twitter.username}` 
    : user?.email?.address 
      ? user.email.address.slice(0, 10) + '...'
      : user?.wallet?.address 
        ? user.wallet.address.slice(0, 6) + '...' + user.wallet.address.slice(-4)
        : 'Connected';

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
        {displayName}
      </span>
      <button
        onClick={logout}
        className="px-3 py-1.5 border-2 border-gan-yellow text-gan-yellow rounded-lg hover:bg-gan-yellow hover:text-black transition-all duration-200 text-sm font-bold"
      >
        Disconnect
      </button>
    </div>
  );
}
