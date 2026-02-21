'use client';

import { useState, useEffect } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyClientWrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
    
    // Log Privy initialization
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    console.log('Privy initializing with App ID:', appId ? `${appId.slice(0, 8)}...` : 'MISSING');
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!appId) {
    console.error('Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable');
    return <>{children}</>;
  }

  // Wrap in error boundary
  return (
    <PrivyProviderWrapper appId={appId}>
      {children}
    </PrivyProviderWrapper>
  );
}

function PrivyProviderWrapper({ appId, children }) {
  const [initError, setInitError] = useState(null);

  if (initError) {
    console.error('Privy initialization error:', initError);
    return <>{children}</>;
  }

  try {
    return (
      <PrivyProvider
        appId={appId}
        onSuccess={(user) => {
          console.log('Privy login success:', user?.wallet?.address);
        }}
        config={{
          loginMethods: ['twitter', 'email', 'wallet'],
          appearance: {
            theme: 'dark',
            accentColor: '#ffcc00',
            logo: 'https://gateway.pinata.cloud/ipfs/QmW4PqY6rewBa8do32uHNg3u2w1RQ6JHbMeWapgMbN5NiP',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
          },
          // Add allowed domains
          allowedDomains: [
            'ganland.ai',
            'ganland-explorer.vercel.app',
            'localhost:3000',
          ],
        }}
      >
        {children}
      </PrivyProvider>
    );
  } catch (err) {
    console.error('Privy provider error:', err);
    setInitError(err.message);
    return <>{children}</>;
  }
}
