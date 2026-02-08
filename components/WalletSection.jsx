'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

export default function WalletSection() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [timedOut, setTimedOut] = useState(false);

  // Set a timeout for Privy initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) {
        setTimedOut(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [ready]);

  // Show connect UI if not ready after timeout, or if not authenticated
  if (!ready && !timedOut) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full animate-pulse mb-4" />
          <div className="w-48 h-4 bg-gray-800 rounded animate-pulse" />
          <p className="text-gray-500 text-sm mt-4">Connecting to wallet service...</p>
        </div>
      </div>
    );
  }

  // Show connect button (either timed out or not authenticated)
  if (!authenticated || timedOut) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl">🔐</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 text-center mb-6 max-w-md">
            Sign in with X (Twitter), email, or your existing wallet to access your Ganland portfolio.
          </p>
          <button
            onClick={() => {
              if (ready) {
                login();
              } else {
                // Fallback - redirect to Twitter OAuth or show message
                window.open('https://x.com/GanlandNFT', '_blank');
              }
            }}
            className="px-8 py-3 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-all duration-200 shadow-lg hover:shadow-gan-yellow/30"
          >
            {ready ? 'Connect Wallet' : 'Follow @GanlandNFT'}
          </button>
          
          {!ready && timedOut && (
            <p className="text-gray-500 text-xs mt-4">
              Wallet service unavailable. <a href="https://x.com/GanlandNFT" target="_blank" className="text-gan-yellow hover:underline">Contact us on X</a> for help.
            </p>
          )}
          
          <div className="flex gap-3 mt-6">
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
      </div>
    );
  }

  const displayName = user?.twitter?.username 
    ? `@${user.twitter.username}` 
    : user?.email?.address 
    || (user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4));

  return (
    <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">✓</span>
        </div>
        <h3 className="text-xl font-bold mb-1">Connected</h3>
        <p className="text-gan-yellow font-mono mb-4">{displayName}</p>
        
        {user?.wallet?.address && (
          <div className="bg-gray-800/50 rounded-lg p-3 mb-4 w-full max-w-md">
            <div className="text-xs text-gray-500 mb-1">Wallet Address</div>
            <div className="font-mono text-sm text-white break-all">{user.wallet.address}</div>
          </div>
        )}
        
        <div className="flex gap-3">
          <a 
            href={`https://basescan.org/address/${user?.wallet?.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
          >
            View on Base
          </a>
          <button
            onClick={logout}
            className="px-4 py-2 border border-gray-600 text-gray-400 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
