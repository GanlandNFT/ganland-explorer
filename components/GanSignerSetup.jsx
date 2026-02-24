'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Silent wallet state sync
 * 
 * Wallet is created via API in onSuccess callback.
 * This component silently refreshes the page once when wallet appears.
 * NO VISIBLE UI.
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const hasRefreshed = useRef(false);
  const checkCount = useRef(0);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    
    if (embeddedWallet) {
      // Wallet exists - we're good
      console.log('[GAN] ✅ Wallet ready:', embeddedWallet.address);
      return;
    }
    
    // No wallet yet - it's being created via API
    // Do a single refresh after 2 seconds to pick it up
    if (!hasRefreshed.current && checkCount.current < 3) {
      checkCount.current++;
      console.log('[GAN] Wallet being created, will refresh...');
      
      const timer = setTimeout(() => {
        if (!hasRefreshed.current) {
          hasRefreshed.current = true;
          window.location.reload();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [ready, authenticated, user, embeddedWallet]);

  // Completely silent - no UI
  return null;
}
