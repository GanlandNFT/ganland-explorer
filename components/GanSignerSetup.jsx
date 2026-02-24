'use client';

import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Monitors wallet delegation status
 * 
 * Delegation should be configured in Privy Dashboard to happen automatically.
 * This component just logs the status for debugging.
 * 
 * To enable auto-delegation: Privy Dashboard → Embedded Wallets → Enable "Delegated Actions"
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) return;
    
    if (embeddedWallet.delegated) {
      console.log('[GAN] ✅ Wallet delegated:', embeddedWallet.address);
      console.log('[GAN] GAN agent can sign transactions for this wallet');
    } else {
      console.log('[GAN] ⚠️ Wallet NOT delegated:', embeddedWallet.address);
      console.log('[GAN] Enable delegation in Privy Dashboard → Embedded Wallets');
    }
  }, [ready, authenticated, embeddedWallet]);

  // No UI - just logging
  return null;
}
