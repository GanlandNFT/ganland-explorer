'use client';

import { useState, useEffect, useCallback } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import GanSignerSetup from './GanSignerSetup';

export default function PrivyClientWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create wallet with GAN signer on login success
  const handleLoginSuccess = useCallback(async (user, isNewUser, wasAlreadyAuthenticated, loginMethod, linkedAccount) => {
    console.log('[Privy] Login success:', user?.twitter?.username || user?.email?.address || 'user');
    console.log('[Privy] Is new user:', isNewUser);
    
    // Check if user already has embedded wallet
    const hasWallet = user?.linkedAccounts?.some(
      a => a.type === 'wallet' && a.walletClientType === 'privy'
    );
    
    if (hasWallet) {
      console.log('[GAN] User already has wallet');
      return;
    }
    
    // For new users without wallet, create via our API with GAN signer
    if (isNewUser || !hasWallet) {
      console.log('[GAN] Creating wallet with GAN signer...');
      try {
        const response = await fetch('/api/create-wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            privyUserId: user.id,
          })
        });
        
        const result = await response.json();
        if (response.ok && result.wallet) {
          console.log('[GAN] ✅ Wallet created:', result.wallet);
          // Reload to pick up new wallet in Privy state
          setTimeout(() => window.location.reload(), 500);
        } else {
          console.log('[GAN] Wallet creation issue:', result.error);
        }
      } catch (err) {
        console.log('[GAN] Error creating wallet:', err.message);
      }
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
          logo: 'https://ganland.ai/gan-logo.jpg',
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
