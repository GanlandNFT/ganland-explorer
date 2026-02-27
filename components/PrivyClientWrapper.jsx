'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GanWalletProvider, useGanWallet } from '../hooks/useGanWallet';
import { wagmiConfig } from '../lib/wagmi';
import { supabase } from '../lib/supabase';

// Create a single QueryClient instance
const queryClient = new QueryClient();

// Robust singleton guard using window object (survives HMR and module re-imports)
const PRIVY_SINGLETON_KEY = '__PRIVY_PROVIDER_MOUNTED__';

// Module-level deduplication to prevent race conditions
const walletCreationPromises = new Map();

async function createWalletWithDedup(user, setCreatedWallet, setCreating) {
  const userId = user.id;
  
  // If there's already a creation in progress for this user, wait for it
  if (walletCreationPromises.has(userId)) {
    console.log('[GAN] Wallet creation already in progress, waiting...');
    return walletCreationPromises.get(userId);
  }
  
  // Create the promise and store it
  const promise = createWalletWithGanSigner(user, setCreatedWallet, setCreating);
  walletCreationPromises.set(userId, promise);
  
  try {
    const result = await promise;
    return result;
  } finally {
    // Clean up after completion
    walletCreationPromises.delete(userId);
  }
}

async function createWalletWithGanSigner(user, setCreatedWallet, setCreating) {
  const xHandle = user?.twitter?.username;
  console.log('[GAN] Creating wallet for:', xHandle || user?.email?.address || user.id);
  
  setCreating(true);
  
  try {
    // Check Supabase for existing HD wallet holder
    if (xHandle && supabase) {
      try {
        const { data } = await supabase
          .from('users')
          .select('wallet_address')
          .eq('x_handle', xHandle.toLowerCase())
          .single();
        
        if (data?.wallet_address) {
          console.log('[GAN] HD wallet holder detected:', data.wallet_address);
          sessionStorage.setItem('gan_hd_wallet', data.wallet_address);
        }
      } catch (e) {
        // User not in HD table - that's fine
      }
    }

    // Create wallet via API with GAN signer
    console.log('[GAN] Calling /api/create-wallet...');
    const response = await fetch('/api/create-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyUserId: user.id })
    });
    
    const result = await response.json();
    console.log('[GAN] API response:', response.status, result);
    
    if (response.ok && result.wallet) {
      console.log('[GAN] ✅ Wallet ready:', result.wallet, result.existing ? '(existing)' : '(new)');
      
      // Immediately update context - components will re-render
      setCreatedWallet(result.wallet);
      sessionStorage.setItem('gan_wallet_just_created', result.wallet);
      
      // Update Supabase with new Privy wallet
      if (xHandle && supabase) {
        await supabase
          .from('users')
          .upsert({
            x_handle: xHandle.toLowerCase(),
            wallet_address: result.wallet,
            x_id: user.twitter?.subject
          }, { onConflict: 'x_handle' });
      }
      
      return result.wallet;
    } else {
      console.error('[GAN] ❌ Wallet creation failed:', result.error);
      setCreating(false);
      return null;
    }
  } catch (err) {
    console.error('[GAN] ❌ Error:', err.message);
    setCreating(false);
    return null;
  }
}

// Inner component that syncs wallet state - handles BOTH new login AND restored sessions
function WalletSyncHandler() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { setCreatedWallet, setCreating, hasWallet, address } = useGanWallet();
  const syncAttempted = useRef(new Set()); // Track which users we've tried to sync

  // Debug log all state changes
  useEffect(() => {
    console.log('[WalletSync] State:', {
      privyReady: ready,
      walletsReady,
      authenticated,
      userId: user?.id?.slice(0, 20),
      linkedAccounts: user?.linkedAccounts?.length,
      walletsCount: wallets?.length,
      hasWallet,
      address: address?.slice(0, 10),
    });
  }, [ready, walletsReady, authenticated, user, wallets, hasWallet, address]);

  useEffect(() => {
    // Wait for Privy to be fully ready
    if (!ready || !walletsReady || !authenticated || !user) {
      console.log('[WalletSync] Not ready yet:', { ready, walletsReady, authenticated, hasUser: !!user });
      return;
    }

    // If we already have wallet address in context, we're done
    if (hasWallet && address) {
      console.log('[WalletSync] Already have wallet:', address);
      return;
    }

    // Prevent duplicate sync attempts for same user in this session
    if (syncAttempted.current.has(user.id)) {
      console.log('[WalletSync] Already attempted sync for this user');
      return;
    }

    // Check Privy's wallets hook first (most reliable for signing)
    const privyWallet = wallets?.find(w => w.walletClientType === 'privy');
    if (privyWallet?.address) {
      console.log('[WalletSync] Found wallet via useWallets:', privyWallet.address);
      setCreatedWallet(privyWallet.address);
      return;
    }

    // Check if user already has embedded wallet from Privy (from linkedAccounts)
    const existingWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (existingWallet?.address) {
      console.log('[WalletSync] Found wallet via linkedAccounts:', existingWallet.address);
      setCreatedWallet(existingWallet.address);
      return;
    }

    // No existing wallet - need to create one (with deduplication)
    console.log('[WalletSync] No wallet found, creating new wallet...');
    syncAttempted.current.add(user.id);
    createWalletWithDedup(user, setCreatedWallet, setCreating);
  }, [ready, walletsReady, authenticated, user, wallets, hasWallet, address, setCreatedWallet, setCreating]);

  // Clear sync attempts on logout
  useEffect(() => {
    if (ready && !authenticated) {
      syncAttempted.current.clear();
    }
  }, [ready, authenticated]);

  return null;
}

function PrivyProviderWrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  const [isFirstInstance, setIsFirstInstance] = useState(false);

  useEffect(() => {
    // Robust singleton check using window object (survives HMR and module re-imports)
    if (typeof window !== 'undefined') {
      if (window[PRIVY_SINGLETON_KEY]) {
        console.warn('[Privy] PrivyProvider already mounted, skipping duplicate');
        setMounted(true);
        setIsFirstInstance(false);
        return;
      }
      
      window[PRIVY_SINGLETON_KEY] = true;
      setIsFirstInstance(true);
      setMounted(true);
      console.log('[Privy] Mounted (first instance)');
      
      return () => {
        window[PRIVY_SINGLETON_KEY] = false;
        console.log('[Privy] Unmounted');
      };
    } else {
      // SSR - just render children
      setMounted(true);
      setIsFirstInstance(true);
    }
  }, []);

  // Don't render children until mounted - prevents useWallets from being called outside PrivyProvider
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gan-black">
        {/* Minimal loading state while hydrating */}
      </div>
    );
  }

  // If this is a duplicate instance, just render children without provider
  // (they'll inherit from the first instance via React context)
  if (!isFirstInstance) {
    console.log('[Privy] Rendering as pass-through (not first instance)');
    return <>{children}</>;
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    console.error('[Privy] Missing NEXT_PUBLIC_PRIVY_APP_ID');
    return <>{children}</>;
  }

  console.log('[Privy] Rendering PrivyProvider');

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <PrivyProvider
          appId={appId}
          config={{
            loginMethods: ['twitter', 'email', 'farcaster'],
            appearance: {
              theme: 'dark',
              accentColor: '#d4a84b',
              logo: 'https://gateway.pinata.cloud/ipfs/QmW4PqY6rewBa8do32uHNg3u2w1RQ6JHbMeWapgMbN5NiP',
              showWalletLoginFirst: false,
            },
            embeddedWallets: {
              createOnLogin: 'off',
              noPromptOnSignature: true,
            },
            externalWallets: {
              autoConnect: false,
            },
          }}
        >
          <GanWalletProvider>
            <WalletSyncHandler />
            {children}
          </GanWalletProvider>
        </PrivyProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}

export default function PrivyClientWrapper({ children }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
