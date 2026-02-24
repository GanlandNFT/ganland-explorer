'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

const GanWalletContext = createContext(null);

/**
 * GanWalletProvider - Bridges Privy state with immediate wallet creation
 * 
 * Problem: Privy's useWallets() doesn't sync immediately after API wallet creation
 * Solution: We track the wallet address ourselves and share it via context
 */
export function GanWalletProvider({ children }) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  
  // Our own wallet state - updated immediately on creation
  const [ganWallet, setGanWallet] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [justCreated, setJustCreated] = useState(false);

  // Get Privy's embedded wallet
  const privyWallet = wallets?.find(w => w.walletClientType === 'privy');

  // Sync from Privy when it catches up
  useEffect(() => {
    if (privyWallet?.address && !ganWallet) {
      console.log('[GanWallet] Synced from Privy:', privyWallet.address);
      setGanWallet({
        address: privyWallet.address,
        wallet: privyWallet, // Full Privy wallet object for signing
      });
    }
  }, [privyWallet, ganWallet]);

  // Check sessionStorage for just-created wallet on mount
  useEffect(() => {
    const created = sessionStorage.getItem('gan_wallet_just_created');
    if (created && !ganWallet) {
      console.log('[GanWallet] Found just-created wallet:', created);
      setGanWallet({ address: created, wallet: null });
      setJustCreated(true);
    }
  }, [ganWallet]);

  // When Privy wallet appears after creation, upgrade our state
  useEffect(() => {
    if (justCreated && privyWallet?.address) {
      console.log('[GanWallet] Privy synced, upgrading wallet object');
      setGanWallet({
        address: privyWallet.address,
        wallet: privyWallet,
      });
      setJustCreated(false);
      sessionStorage.removeItem('gan_wallet_just_created');
    }
  }, [justCreated, privyWallet]);

  // Clear on logout
  useEffect(() => {
    if (ready && !authenticated) {
      setGanWallet(null);
      setJustCreated(false);
    }
  }, [ready, authenticated]);

  // Manual wallet creation trigger (called from PrivyClientWrapper)
  const setCreatedWallet = useCallback((address) => {
    console.log('[GanWallet] Wallet created:', address);
    setGanWallet({ address, wallet: null });
    setJustCreated(true);
    setIsCreating(false);
  }, []);

  const setCreating = useCallback((creating) => {
    setIsCreating(creating);
  }, []);

  const value = {
    // Wallet state
    address: ganWallet?.address || null,
    wallet: ganWallet?.wallet || privyWallet || null,
    
    // Status flags
    ready: ready && walletsReady,
    authenticated,
    hasWallet: !!(ganWallet?.address || privyWallet?.address),
    isCreating,
    justCreated,
    
    // User info
    user,
    xHandle: user?.twitter?.username,
    
    // Actions
    setCreatedWallet,
    setCreating,
  };

  return (
    <GanWalletContext.Provider value={value}>
      {children}
    </GanWalletContext.Provider>
  );
}

/**
 * useGanWallet - Hook to access wallet state
 * Use this instead of useWallets() for immediate updates
 */
export function useGanWallet() {
  const context = useContext(GanWalletContext);
  if (!context) {
    throw new Error('useGanWallet must be used within GanWalletProvider');
  }
  return context;
}
