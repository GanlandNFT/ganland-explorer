'use client';

import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Silent wallet monitor (no reload logic here)
 * Reload is handled in PrivyClientWrapper onSuccess after wallet creation.
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      console.log('[GAN] ✅ Wallet active:', embeddedWallet.address);
    }
  }, [ready, authenticated, embeddedWallet]);

  // Completely silent - no UI, no reload logic
  return null;
}
