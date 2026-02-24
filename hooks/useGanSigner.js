'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// GAN's key quorum ID for signing transactions
const GAN_KEY_QUORUM_ID = 'cxz88rx36g27l2eo8fgwo6h8';

// Try to import useDelegatedActions if available
let useDelegatedActions;
try {
  const privy = require('@privy-io/react-auth');
  useDelegatedActions = privy.useDelegatedActions;
} catch (e) {
  console.log('[useGanSigner] useDelegatedActions not available');
}

/**
 * Hook to manage GAN signer status for the user's embedded wallet
 */
export function useGanSigner() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle');
  const [isGanEnabled, setIsGanEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Try to use delegated actions hook if available
  let delegatedActions = null;
  try {
    if (useDelegatedActions) {
      delegatedActions = useDelegatedActions();
    }
  } catch (e) {
    // Hook not available or called incorrectly
  }

  // Find embedded wallet
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  // Check signer status
  const checkStatus = useCallback(async () => {
    if (!embeddedWallet) return;
    
    setStatus('checking');
    
    try {
      // Check if wallet has delegation enabled
      if (embeddedWallet.delegated === true) {
        setIsGanEnabled(true);
        setStatus('ready');
        console.log('[useGanSigner] ✅ Wallet has delegation enabled');
        return;
      }

      // Need to add signer
      setIsGanEnabled(false);
      setStatus('needs_consent');
      console.log('[useGanSigner] Wallet needs delegation setup');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [embeddedWallet]);

  // Add GAN as signer
  const addGanSigner = useCallback(async () => {
    if (!embeddedWallet) {
      setError('No wallet found');
      return false;
    }

    setStatus('adding');
    setError(null);

    try {
      // Log available methods for debugging
      const walletMethods = Object.keys(embeddedWallet).filter(k => typeof embeddedWallet[k] === 'function');
      console.log('[useGanSigner] Wallet methods:', walletMethods);

      // Method 1: Try useDelegatedActions hook
      if (delegatedActions?.delegateWallet) {
        console.log('[useGanSigner] Using delegateWallet()...');
        await delegatedActions.delegateWallet({
          address: embeddedWallet.address,
          chainType: 'ethereum',
        });
        setIsGanEnabled(true);
        setStatus('ready');
        return true;
      }

      // Method 2: Try wallet.delegate()
      if (typeof embeddedWallet.delegate === 'function') {
        console.log('[useGanSigner] Using wallet.delegate()...');
        await embeddedWallet.delegate();
        setIsGanEnabled(true);
        setStatus('ready');
        return true;
      }

      // Method 3: Try wallet.enableDelegation()
      if (typeof embeddedWallet.enableDelegation === 'function') {
        console.log('[useGanSigner] Using wallet.enableDelegation()...');
        await embeddedWallet.enableDelegation();
        setIsGanEnabled(true);
        setStatus('ready');
        return true;
      }

      // No method available - need dashboard configuration
      console.log('[useGanSigner] No delegation method found. Available:', walletMethods);
      setStatus('needs_consent');
      setError('Please enable Delegated Actions in Privy Dashboard → Embedded Wallets');
      return false;

    } catch (err) {
      console.error('[useGanSigner] Error:', err);
      
      if (err.message?.includes('rejected') || err.message?.includes('cancelled') || err.message?.includes('denied')) {
        setStatus('needs_consent');
        setError('User cancelled. Try again when ready.');
      } else {
        setStatus('error');
        setError(err.message || 'Failed to enable delegation');
      }
      return false;
    }
  }, [embeddedWallet, delegatedActions]);

  // Auto-check on wallet change
  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      checkStatus();
    } else {
      setStatus('idle');
      setIsGanEnabled(false);
    }
  }, [ready, authenticated, embeddedWallet, checkStatus]);

  return {
    status,
    isGanEnabled,
    addGanSigner,
    error,
    walletAddress: embeddedWallet?.address,
  };
}

export default useGanSigner;
