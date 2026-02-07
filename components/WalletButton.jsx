'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  if (!ready) {
    return (
      <div className="w-32 h-9 bg-gray-800 rounded animate-pulse" />
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-4 py-2 bg-gan-yellow text-black font-bold rounded hover:bg-gan-gold transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
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
  );
}
