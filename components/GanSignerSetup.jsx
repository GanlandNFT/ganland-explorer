'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useWallets, useDelegatedActions } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Silently auto-delegates wallet on login
 * No UI - happens automatically in background
 * User consent is covered by ToS acceptance
 * 
 * Uses Privy's built-in delegation - enables the app to sign on behalf of users.
 * No separate authorization key needed - the app itself becomes the delegated signer.
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { delegateWallet } = useDelegatedActions();
  const attemptedRef = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) return;
    if (attemptedRef.current) return;
    
    // Already delegated - nothing to do
    if (embeddedWallet.delegated) {
      console.log('[GAN] Wallet already delegated ✅', embeddedWallet.address);
      return;
    }
    
    attemptedRef.current = true;
    
    (async () => {
      try {
        console.log('[GAN] Enabling delegation for wallet:', embeddedWallet.address);
        await delegateWallet({ address: embeddedWallet.address, chainType: 'ethereum' });
        console.log('[GAN] Delegation enabled ✅');
        console.log('[GAN] GAN agent can now sign transactions for this wallet');
      } catch (err) {
        console.log('[GAN] Delegation failed:', err.message);
        attemptedRef.current = false; // Allow retry on next mount
      }
    })();
  }, [ready, authenticated, embeddedWallet, delegateWallet]);

  // No UI - completely invisible
  return null;
}
