'use client';

import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Logs wallet status after login
 * 
 * Web users: Privy creates wallet normally (no GAN signer by default)
 * X users: Wallets created via API with GAN signer pre-attached
 * 
 * GAN signer can be added later when user wants agent features.
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    
    if (embeddedWallet) {
      console.log('[GAN] ✅ Wallet ready:', embeddedWallet.address);
      console.log('[GAN] Delegated:', embeddedWallet.delegated ? 'Yes' : 'No');
    } else {
      console.log('[GAN] ⏳ Waiting for wallet...');
    }
  }, [ready, authenticated, user, embeddedWallet]);

  return null;
}
