'use client';

import { useState, useEffect, useCallback } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyClientWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Log login success
  const handleLoginSuccess = useCallback((user) => {
    console.log('[Privy] Login success:', user?.twitter?.username || user?.email?.address || 'user');
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
        // Embedded wallets - let Privy create natively for stable auth
        // GAN signer can be added later via delegation
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: true,
        },
        // External wallet settings
        externalWallets: {
          autoConnect: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
