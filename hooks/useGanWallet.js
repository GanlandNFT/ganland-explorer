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

  // Get Privy's embedded wallet from useWallets hook
  const privyWallet = wallets?.find(w => w.walletClientType === 'privy');

  // Also check user.linkedAccounts for the wallet (more reliable on session restore)
  const linkedWallet = user?.linkedAccounts?.find(
    a => a.type === 'wallet' && a.walletClientType === 'privy'
  );

  // Debug log state changes
  useEffect(() => {
    console.log('[GanWalletContext] State:', {
      ganWallet: ganWallet?.address?.slice(0, 10),
      privyWallet: privyWallet?.address?.slice(0, 10),
      linkedWallet: linkedWallet?.address?.slice(0, 10),
      isCreating,
      justCreated,
      ready,
      authenticated,
    });
  }, [ganWallet, privyWallet, linkedWallet, isCreating, justCreated, ready, authenticated]);

  // Sync from Privy useWallets when it catches up
  useEffect(() => {
    if (privyWallet?.address && !ganWallet) {
      console.log('[GanWallet] Synced from useWallets:', privyWallet.address);
      setGanWallet({
        address: privyWallet.address,
        wallet: privyWallet, // Full Privy wallet object for signing
      });
    }
  }, [privyWallet, ganWallet]);

  // Sync from linkedAccounts (fires faster on session restore)
  useEffect(() => {
    if (linkedWallet?.address && !ganWallet && !privyWallet) {
      console.log('[GanWallet] Synced from linkedAccounts:', linkedWallet.address);
      setGanWallet({
        address: linkedWallet.address,
        wallet: null, // Will be upgraded when useWallets catches up
      });
    }
  }, [linkedWallet, ganWallet, privyWallet]);

  // Upgrade wallet object when useWallets catches up (for signing capability)
  useEffect(() => {
    if (ganWallet?.address && privyWallet?.address && !ganWallet.wallet) {
      console.log('[GanWallet] Upgrading with full wallet object');
      setGanWallet({
        address: privyWallet.address,
        wallet: privyWallet,
      });
    }
  }, [ganWallet, privyWallet]);

  // Check sessionStorage for just-created wallet on mount
  useEffect(() => {
    const created = sessionStorage.getItem('gan_wallet_just_created');
    if (created && !ganWallet) {
      console.log('[GanWallet] Found in sessionStorage:', created);
      setGanWallet({ address: created, wallet: null });
      setJustCreated(true);
    }
  }, [ganWallet]);

  // When Privy wallet appears after creation, upgrade our state
  useEffect(() => {
    if (justCreated && privyWallet?.address) {
      console.log('[GanWallet] Privy synced after creation, upgrading');
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
      console.log('[GanWallet] User logged out, clearing state');
      setGanWallet(null);
      setJustCreated(false);
      sessionStorage.removeItem('gan_wallet_just_created');
    }
  }, [ready, authenticated]);

  // Manual wallet creation trigger (called from WalletSyncHandler)
  const setCreatedWallet = useCallback((address) => {
    console.log('[GanWallet] setCreatedWallet called:', address);
    setGanWallet(prev => ({
      address,
      wallet: prev?.wallet || null, // Keep existing wallet object if we have one
    }));
    setJustCreated(true);
    setIsCreating(false);
  }, []);

  const setCreating = useCallback((creating) => {
    console.log('[GanWallet] setCreating:', creating);
    setIsCreating(creating);
  }, []);

  // Compute final address (prefer ganWallet, fall back to privy)
  const finalAddress = ganWallet?.address || privyWallet?.address || linkedWallet?.address || null;

  const value = {
    // Wallet state
    address: finalAddress,
    wallet: ganWallet?.wallet || privyWallet || null,
    
    // Status flags  
    ready: ready && walletsReady,
    authenticated,
    hasWallet: !!finalAddress,
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
