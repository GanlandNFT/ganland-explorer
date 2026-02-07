'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  // Still loading Privy
  if (!ready) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-700 text-gray-400 font-bold rounded border border-gray-600 cursor-wait"
      >
        Loading...
      </button>
    );
  }

  // Not connected - show connect button
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

  // Connected - show user info
  const displayName = user?.twitter?.username 
    ? `@${user.twitter.username}` 
    : user?.email?.address?.slice(0, 10) + '...' 
    || (user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4));

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
