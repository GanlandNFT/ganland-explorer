'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { GanWalletProvider, useGanWallet } from '../hooks/useGanWallet';
import { supabase } from '../lib/supabase';

// Inner component that syncs wallet state - handles BOTH new login AND restored sessions
function WalletSyncHandler() {
  const { ready, authenticated, user } = usePrivy();
  const { setCreatedWallet, setCreating, hasWallet, address } = useGanWallet();
  const hasTriggered = useRef(false);
  const lastUserId = useRef(null);

  useEffect(() => {
    // Wait for Privy to be ready and user to be authenticated
    if (!ready || !authenticated || !user) {
      hasTriggered.current = false;
      lastUserId.current = null;
      return;
    }

    // Prevent double-triggering for same user
    if (hasTriggered.current && lastUserId.current === user.id) {
      return;
    }

    // If we already have wallet address in context, we're done
    if (hasWallet && address) {
      console.log('[GAN] Wallet already in context:', address);
      return;
    }

    // Check if user already has embedded wallet from Privy (from linkedAccounts)
    const existingWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );

    if (existingWallet?.address) {
      console.log('[GAN] Found existing Privy wallet:', existingWallet.address);
      setCreatedWallet(existingWallet.address);
      lastUserId.current = user.id;
      return;
    }

    // No existing wallet - need to create one
    console.log('[GAN] No wallet found, creating...');
    hasTriggered.current = true;
    lastUserId.current = user.id;
    createWalletWithGanSigner(user, setCreatedWallet, setCreating);
  }, [ready, authenticated, user, hasWallet, address, setCreatedWallet, setCreating]);

  return null;
}

async function createWalletWithGanSigner(user, setCreatedWallet, setCreating) {
  const xHandle = user?.twitter?.username;
  console.log('[GAN] Creating wallet with GAN signer for:', xHandle || user?.email?.address || user.id);
  
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
    const response = await fetch('/api/create-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privyUserId: user.id })
    });
    
    const result = await response.json();
    
    if (response.ok && result.wallet) {
      console.log('[GAN] ✅ Wallet created:', result.wallet);
      
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
    } else {
      console.log('[GAN] Wallet creation issue:', result.error);
      setCreating(false);
    }
  } catch (err) {
    console.log('[GAN] Error:', err.message);
    setCreating(false);
  }
}

function PrivyProviderWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    console.error('Missing NEXT_PUBLIC_PRIVY_APP_ID');
    return <>{children}</>;
  }

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
  );
}

export default function PrivyClientWrapper({ children }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
