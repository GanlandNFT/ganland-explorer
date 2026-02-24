'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { GanWalletProvider, useGanWallet } from '../hooks/useGanWallet';
import { supabase } from '../lib/supabase';

// Inner component that has access to GanWallet context
function WalletCreationHandler({ user }) {
  const { setCreatedWallet, setCreating, hasWallet } = useGanWallet();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!user || hasWallet || hasTriggered.current) return;
    
    // Check if user already has embedded wallet from Privy
    const existingWallet = user.linkedAccounts?.find(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );
    
    if (existingWallet) {
      console.log('[GAN] User has existing wallet:', existingWallet.address);
      setCreatedWallet(existingWallet.address);
      return;
    }

    // Create wallet with GAN signer
    hasTriggered.current = true;
    createWalletWithGanSigner(user, setCreatedWallet, setCreating);
  }, [user, hasWallet, setCreatedWallet, setCreating]);

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
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLoginSuccess = useCallback((user, isNewUser) => {
    console.log('[Privy] Login success:', user?.twitter?.username || user?.email?.address || 'user');
    setCurrentUser(user);
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
      onSuccess={handleLoginSuccess}
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
        {children}
        {currentUser && <WalletCreationHandler user={currentUser} />}
      </GanWalletProvider>
    </PrivyProvider>
  );
}

export default function PrivyClientWrapper({ children }) {
  return <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
}
