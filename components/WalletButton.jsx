'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import dynamic from 'next/dynamic';

// Dynamically import AccountSettings to avoid SSR issues
const AccountSettings = dynamic(() => import('./AccountSettings'), { ssr: false });

export default function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Full disconnect: logout from Privy AND disconnect any external wallets
  const handleFullDisconnect = async () => {
    setShowDropdown(false);
    
    // Disconnect all external wallets from Privy
    for (const wallet of wallets || []) {
      if (wallet.walletClientType !== 'privy' && wallet.disconnect) {
        try { await wallet.disconnect(); } catch (e) {}
      }
    }
    
    // Try to revoke browser wallet permissions (MetaMask, etc.)
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        });
      } catch (e) {
        // wallet_revokePermissions not supported by all wallets - that's ok
      }
    }
    
    await logout();
  };

  // Get display name
  const displayName = user?.twitter?.username 
    ? `@${user.twitter.username}` 
    : user?.email?.address?.split('@')[0]
    || 'Connected';

  // Still initializing
  if (!ready) {
    return (
      <button disabled className="px-3 py-2 bg-gray-700 text-gray-400 font-bold rounded-lg border border-gray-600 cursor-wait text-sm">
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </span>
      </button>
    );
  }

  // Not logged in
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

  // Logged in - show dropdown with options
  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-3 py-2 bg-gray-800 text-gan-yellow font-bold rounded-lg border border-gan-yellow/50 hover:border-gan-yellow transition-all duration-200 text-sm flex items-center gap-2"
        >
          <span className="max-w-[100px] truncate">{displayName}</span>
          <svg className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            {/* Account Settings */}
            <button
              onClick={() => { setShowDropdown(false); setShowSettings(true); }}
              className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </button>
            
            {/* Disconnect */}
            <button
              onClick={handleFullDisconnect}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors text-sm flex items-center gap-2 border-t border-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Account Settings Modal */}
      <AccountSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
