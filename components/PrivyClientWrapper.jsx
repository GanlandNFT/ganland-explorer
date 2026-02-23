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
          // Use direct URL instead of IPFS for better Safari compatibility
          logo: 'https://ganland.ai/gan-logo.jpg',
        },
        // Embedded wallets - always create one on social login
        embeddedWallets: {
          createOnLogin: 'all-users',
        },
        // Wallet list config - hide external wallet connection option initially
        walletList: ['detected_wallets'],
        // Don't auto-connect to any external wallets
        // User must explicitly choose to connect MetaMask
      }}
    >
      {children}
    </PrivyProvider>
  );
}
