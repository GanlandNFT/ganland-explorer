'use client';

import { useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyClientWrapper({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      onSuccess={(user) => {
        console.log('[Privy] Login success:', user?.twitter?.username || user?.email?.address || 'wallet user');
      }}
      config={{
        // Login methods - twitter first for social-first experience
        loginMethods: ['twitter', 'email', 'wallet'],
        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#d4a84b',
          logo: 'https://gateway.pinata.cloud/ipfs/QmW4PqY6rewBa8do32uHNg3u2w1RQ6JHbMeWapgMbN5NiP',
        },
        // Embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // External wallets config
        externalWallets: {
          // Don't auto-connect external wallets - let user choose
          coinbaseWallet: { connectionOptions: 'smartWalletOnly' },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
