'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * Hook to manage GAN signer status for the user's embedded wallet
 * 
 * Privy Delegated Actions must be enabled in Dashboard → Embedded Wallets → Authorization
 * to allow server-side signing.
 */
export function useGanSigner() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle');
  const [isGanEnabled, setIsGanEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);

  // Find embedded wallet
  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  // Check signer status
  const checkStatus = useCallback(async () => {
    if (!embeddedWallet) {
      setStatus('no_wallet');
      return;
    }
    
    setStatus('checking');
    
    try {
      // Log available wallet methods for debugging
      const methods = Object.keys(embeddedWallet).filter(k => typeof embeddedWallet[k] === 'function');
      setAvailableMethods(methods);
      console.log('[useGanSigner] Wallet methods:', methods);
      console.log('[useGanSigner] Wallet delegated status:', embeddedWallet.delegated);

      // Check if wallet has delegation enabled
      if (embeddedWallet.delegated === true) {
        setIsGanEnabled(true);
        setStatus('ready');
        console.log('[useGanSigner] ✅ Wallet has delegation enabled');
        return;
      }

      // Need to add signer - check if method is available
      if (typeof embeddedWallet.delegate === 'function') {
        setStatus('needs_consent');
        console.log('[useGanSigner] Wallet needs delegation setup (delegate available)');
      } else {
        setStatus('unavailable');
        setError('Delegation not available. Enable "Delegated Actions" in Privy Dashboard → Authorization');
        console.log('[useGanSigner] ⚠️ delegate() method not available on wallet');
      }
    } catch (err) {
      console.error('[useGanSigner] Check error:', err);
      setError(err.message);
      setStatus('error');
    }
  }, [embeddedWallet]);

  // Add GAN as signer
  const addGanSigner = useCallback(async () => {
    if (!embeddedWallet) {
      setError('No embedded wallet found. Please log in with X or email.');
      return false;
    }

    setStatus('adding');
    setError(null);

    try {
      // Method 1: wallet.delegate() - standard Privy method
      if (typeof embeddedWallet.delegate === 'function') {
        console.log('[useGanSigner] Using wallet.delegate()...');
        await embeddedWallet.delegate();
        setIsGanEnabled(true);
        setStatus('ready');
        console.log('[useGanSigner] ✅ Delegation enabled successfully');
        return true;
      }

      // Method 2: wallet.enableDelegation() - older API
      if (typeof embeddedWallet.enableDelegation === 'function') {
        console.log('[useGanSigner] Using wallet.enableDelegation()...');
        await embeddedWallet.enableDelegation();
        setIsGanEnabled(true);
        setStatus('ready');
        return true;
      }

      // No method available
      console.log('[useGanSigner] No delegation method available');
      console.log('[useGanSigner] Available methods:', availableMethods);
      setStatus('unavailable');
      setError('Signer setup not available. Check console for details.');
      return false;

    } catch (err) {
      console.error('[useGanSigner] Error:', err);
      
      // Handle common error cases
      if (err.message?.includes('rejected') || err.message?.includes('cancelled') || err.message?.includes('denied')) {
        setStatus('needs_consent');
        setError('Request cancelled. Try again when ready.');
      } else if (err.message?.includes('PrivyProvider') || err.message?.includes('wrap your application')) {
        setStatus('error');
        setError('App configuration error. Please refresh the page.');
      } else {
        setStatus('error');
        setError(err.message || 'Failed to enable delegation');
      }
      return false;
    }
  }, [embeddedWallet, availableMethods]);

  // Auto-check on wallet change
  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      checkStatus();
    } else if (ready && !authenticated) {
      setStatus('idle');
      setIsGanEnabled(false);
      setError(null);
    }
  }, [ready, authenticated, embeddedWallet, checkStatus]);

  return {
    status,
    isGanEnabled,
    addGanSigner,
    error,
    walletAddress: embeddedWallet?.address,
    availableMethods,
    checkStatus,
  };
}

export default useGanSigner;
