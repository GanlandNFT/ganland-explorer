'use client';

import { useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import GanSignerSetup from './GanSignerSetup';

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
        // Login methods - social first, no wallet login (like Bankr)
        // Users login with social, get embedded wallet, can link external later
        loginMethods: ['twitter', 'email', 'farcaster'],
        // Appearance
        appearance: {
          theme: 'dark',
          accentColor: '#d4a84b',
          logo: 'https://ganland.ai/gan-logo.jpg',
          showWalletLoginFirst: false,
        },
        // Embedded wallets - we'll create them server-side with GAN signer
        embeddedWallets: {
          // Don't auto-create - we create via API with signer attached
          createOnLogin: 'off',
          // Don't show UI prompts for embedded wallet signatures
          noPromptOnSignature: true,
        },
        // External wallet settings
        externalWallets: {
          // Disable auto-reconnect to external wallets on page load
          autoConnect: false,
        },
      }}
    >
      {children}
      {/* Auto-setup GAN signer after login */}
      <GanSignerSetup />
    </PrivyProvider>
  );
}
