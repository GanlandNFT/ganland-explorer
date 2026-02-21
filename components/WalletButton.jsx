'use client';

import { useState, useRef, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowConfirm(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Get display name
  const displayName = user?.twitter?.username 
    ? `@${user.twitter.username}` 
    : user?.wallet?.address 
      ? `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}`
      : 'Connected';

  const handleDisconnect = () => {
    logout();
    setShowDropdown(false);
    setShowConfirm(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Connected button - shows handle or address */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          setShowConfirm(false);
        }}
        className="px-3 py-2 bg-gray-800 text-gan-yellow font-bold rounded-lg border border-gan-yellow/50 hover:border-gan-yellow transition-all duration-200 text-sm flex items-center gap-2"
      >
        {/* Wallet icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="max-w-[100px] truncate">{displayName}</span>
        {/* Dropdown arrow */}
        <svg className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          {!showConfirm ? (
            <>
              {/* Show full address if wallet connected */}
              {user?.wallet?.address && (
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Wallet</p>
                  <p className="text-sm text-white font-mono truncate">{user.wallet.address}</p>
                </div>
              )}
              {/* Show X handle if connected */}
              {user?.twitter?.username && (
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">X Account</p>
                  <p className="text-sm text-white">@{user.twitter.username}</p>
                </div>
              )}
              {/* Disconnect button */}
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Disconnect
              </button>
            </>
          ) : (
            /* Confirmation dialog */
            <div className="p-4">
              <p className="text-sm text-white mb-4">Disconnect wallet?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm font-bold hover:bg-gray-600 transition-colors"
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
