'use client';

import { useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyClientWrapper({ children }) {
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
      onSuccess={(user) => {
        console.log('[Privy] Login success:', user?.twitter?.username || user?.email?.address);
      }}
      config={{
        loginMethods: ['twitter', 'email', 'farcaster'],
        appearance: {
          theme: 'dark',
          accentColor: '#d4a84b',
          logo: 'https://ganland.ai/gan-logo.jpg',
          showWalletLoginFirst: false,
        },
        // Let Privy handle wallets natively - fast and reliable
        embeddedWallets: {
          createOnLogin: 'all-users',
          noPromptOnSignature: true,
        },
        externalWallets: {
          autoConnect: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
