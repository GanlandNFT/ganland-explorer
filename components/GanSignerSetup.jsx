'use client';

import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Minimal wallet sync
 * 
 * Wallet is created via API with GAN signer on login.
 * This just cleans up the session flag when wallet appears.
 * No delays, no reloads.
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated) return;
    
    // Wallet appeared - clean up flag
    if (embeddedWallet) {
      sessionStorage.removeItem('gan_wallet_just_created');
    }
  }, [ready, authenticated, embeddedWallet]);

  return null;
}
