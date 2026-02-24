'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Monitors wallet creation status
 * 
 * Wallet is created via API in onSuccess callback (PrivyClientWrapper)
 * This component shows status and refreshes when wallet is ready.
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [checking, setChecking] = useState(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    
    if (embeddedWallet) {
      console.log('[GAN] ✅ Wallet ready:', embeddedWallet.address);
      setChecking(false);
    } else {
      console.log('[GAN] ⏳ Wallet being created...');
      setChecking(true);
      
      // Poll for wallet to appear (created via API)
      const interval = setInterval(() => {
        console.log('[GAN] Checking for wallet...');
        // Wallet list will update automatically when Privy detects it
      }, 3000);
      
      // Stop polling after 30 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setChecking(false);
      }, 30000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [ready, authenticated, user, embeddedWallet]);

  // Show loading indicator while wallet is being created
  if (checking && !embeddedWallet) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'rgba(0,0,0,0.8)',
        color: '#d4a84b',
        padding: '12px 20px',
        borderRadius: 8,
        fontSize: 14,
        zIndex: 9999,
      }}>
        🔧 Creating your wallet...
      </div>
    );
  }

  return null;
}
