'use client';

import { useState, useEffect, useCallback } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import GanSignerSetup from './GanSignerSetup';
import { supabase } from '../lib/supabase';

export default function PrivyClientWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if user is an existing HD wallet holder
  const checkHDWalletHolder = async (xHandle) => {
    if (!supabase || !xHandle) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_address, x_id')
        .eq('x_handle', xHandle.toLowerCase())
        .single();
      
      if (data?.wallet_address) {
        console.log('[GAN] HD wallet holder detected:', xHandle, data.wallet_address);
        return data;
      }
    } catch (e) {
      // User not found in HD wallet table - that's fine
    }
    return null;
  };

  // Create wallet with GAN signer on login success
  const handleLoginSuccess = useCallback(async (user, isNewUser) => {
    const xHandle = user?.twitter?.username;
    console.log('[Privy] Login success:', xHandle || user?.email?.address || 'user');
    
    // Check if user already has embedded wallet
    const hasWallet = user?.linkedAccounts?.some(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );
    
    if (hasWallet) {
      console.log('[GAN] User already has embedded wallet');
      return;
    }
    
    // Check if user is an HD wallet holder (existing Ganland user)
    if (xHandle) {
      const hdWallet = await checkHDWalletHolder(xHandle);
      if (hdWallet) {
        console.log('[GAN] Existing HD wallet holder - linking wallet:', hdWallet.wallet_address);
        // Store HD wallet info for display/migration purposes
        sessionStorage.setItem('gan_hd_wallet', JSON.stringify(hdWallet));
      }
    }
    
    // Create new embedded wallet via API with GAN signer
    console.log('[GAN] Creating embedded wallet with GAN signer...');
    try {
      const response = await fetch('/api/create-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privyUserId: user.id })
      });
      
      const result = await response.json();
      if (response.ok && result.wallet) {
        console.log('[GAN] ✅ Wallet created with GAN signer:', result.wallet);
        sessionStorage.setItem('gan_wallet_just_created', result.wallet);
        
        // Update Supabase with new Privy wallet if user has X handle
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
      }
    } catch (err) {
      console.log('[GAN] Error:', err.message);
    }
  }, []);

  // Don't render Privy on server
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
        // Login methods - social first
        loginMethods: ['twitter', 'email', 'farcaster'],
        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#d4a84b',
          logo: 'https://gateway.pinata.cloud/ipfs/QmW4PqY6rewBa8do32uHNg3u2w1RQ6JHbMeWapgMbN5NiP',
          showWalletLoginFirst: false,
        },
        // Embedded wallets - OFF because we create via API with GAN signer
        embeddedWallets: {
          createOnLogin: 'off',
          noPromptOnSignature: true,
        },
        // External wallet settings
        externalWallets: {
          autoConnect: false,
        },
      }}
    >
      {children}
      <GanSignerSetup />
    </PrivyProvider>
  );
}
