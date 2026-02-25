'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { GanWalletProvider, useGanWallet } from '../hooks/useGanWallet';
import { supabase } from '../lib/supabase';

async function addGanSignerToWallet(user, walletAddress, setCreatedWallet, setCreating) {
  const xHandle = user?.twitter?.username;
  console.log('[GAN] Adding GAN signer to wallet:', walletAddress);
  
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

    // Add GAN signer to existing wallet via API
    console.log('[GAN] Calling /api/gan-signer...');
    const response = await fetch('/api/gan-signer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        privyUserId: user.id,
        walletAddress: walletAddress 
      })
    });
    
    const result = await response.json();
    console.log('[GAN] API response:', response.status, result);
    
    if (response.ok) {
      console.log('[GAN] ✅ GAN signer added:', result.signerAdded ? 'new' : 'already present');
      
      // Update context
      setCreatedWallet(walletAddress);
      sessionStorage.setItem('gan_wallet_just_created', walletAddress);
      
      // Update Supabase with Privy wallet
      if (xHandle && supabase) {
        await supabase
          .from('users')
          .upsert({
            x_handle: xHandle.toLowerCase(),
            wallet_address: walletAddress,
            x_id: user.twitter?.subject
          }, { onConflict: 'x_handle' });
      }
      
      return walletAddress;
    } else {
      console.error('[GAN] ❌ Failed to add signer:', result.error);
      // Still set the wallet - it works, just without GAN signer
      setCreatedWallet(walletAddress);
      return walletAddress;
    }
  } catch (err) {
    console.error('[GAN] ❌ Error:', err.message);
    // Still set the wallet - it works, just without GAN signer
    setCreatedWallet(walletAddress);
    return walletAddress;
  } finally {
    setCreating(false);
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
      // Add GAN signer if not already done
      if (!sessionStorage.getItem('gan_signer_added_' + privyWallet.address)) {
        sessionStorage.setItem('gan_signer_added_' + privyWallet.address, 'pending');
        addGanSignerToWallet(user, privyWallet.address, setCreatedWallet, setCreating);
      } else {
        setCreatedWallet(privyWallet.address);
      }
      return;
    }

    // Check if user already has embedded wallet from Privy (from linkedAccounts)
    const existingWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (existingWallet?.address) {
      console.log('[WalletSync] Found wallet via linkedAccounts:', existingWallet.address);
      // Add GAN signer if not already done
      if (!sessionStorage.getItem('gan_signer_added_' + existingWallet.address)) {
        sessionStorage.setItem('gan_signer_added_' + existingWallet.address, 'pending');
        addGanSignerToWallet(user, existingWallet.address, setCreatedWallet, setCreating);
      } else {
        setCreatedWallet(existingWallet.address);
      }
      return;
    }

    // No wallet yet - Privy will create one with createOnLogin: 'users-without-wallets'
    // We'll catch it on the next render cycle
    console.log('[WalletSync] No wallet found yet, waiting for Privy to create one...');
    syncAttempted.current.add(user.id);
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

  useEffect(() => {
    setMounted(true);
    console.log('[Privy] Mounted');
  }, []);

  // Don't render children until mounted - prevents useWallets from being called outside PrivyProvider
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gan-black">
        {/* Minimal loading state while hydrating */}
      </div>
    );
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    console.error('[Privy] Missing NEXT_PUBLIC_PRIVY_APP_ID');
    return <>{children}</>;
  }

  console.log('[Privy] Rendering PrivyProvider');

  return (
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
          createOnLogin: 'users-without-wallets', // Let Privy handle wallet creation with recovery
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
  );
}

export default function PrivyClientWrapper({ children }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
