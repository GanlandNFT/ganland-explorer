'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Handles post-wallet-creation refresh
 * 
 * After wallet is created via API, we need to refresh for Privy to see it.
 * But we wait for auth to fully settle first.
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const hasRefreshed = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    // Only run when Privy is fully ready and user is authenticated
    if (!ready || !authenticated) return;
    
    // If wallet already visible, we're good
    if (embeddedWallet) {
      console.log('[GAN] ✅ Wallet visible:', embeddedWallet.address);
      sessionStorage.removeItem('gan_wallet_just_created');
      return;
    }
    
    // Check if we just created a wallet
    const justCreated = sessionStorage.getItem('gan_wallet_just_created');
    
    if (justCreated && !hasRefreshed.current) {
      hasRefreshed.current = true;
      console.log('[GAN] Wallet created, refreshing to sync with Privy...');
      
      // Clear flag first to prevent loop
      sessionStorage.removeItem('gan_wallet_just_created');
      
      // Wait 3 seconds for auth to fully settle, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [ready, authenticated, embeddedWallet]);

  return null;
}
