'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// GAN's key quorum ID for signing transactions
const GAN_KEY_QUORUM_ID = 'cxz88rx36g27l2eo8fgwo6h8';

/**
 * Hook to manage GAN signer status for the user's embedded wallet
 * 
 * Returns:
 * - status: 'idle' | 'checking' | 'ready' | 'needs_consent' | 'adding' | 'error'
 * - isGanEnabled: boolean - whether GAN can sign transactions
 * - addGanSigner: function - call to add GAN as signer (triggers consent)
 * - error: string | null
 */
export function useGanSigner() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle');
  const [isGanEnabled, setIsGanEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Find embedded wallet
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  // Check signer status
  const checkStatus = useCallback(async () => {
    if (!embeddedWallet) return;
    
    setStatus('checking');
    
    try {
      // Check if wallet has GAN signer via delegated flag
      if (embeddedWallet.delegated === true) {
        setIsGanEnabled(true);
        setStatus('ready');
        return;
      }

      // Need to add signer
      setIsGanEnabled(false);
      setStatus('needs_consent');
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
      // Method 1: Direct wallet method (Privy SDK >= 1.70)
      if (typeof embeddedWallet.addSigners === 'function') {
        await embeddedWallet.addSigners({
          signers: [{ signerId: GAN_KEY_QUORUM_ID }]
        });
        setIsGanEnabled(true);
        setStatus('ready');
        return true;
      }

      // Method 2: Fallback - mark as needs consent
      setStatus('needs_consent');
      setError('Please update to the latest version for signer support');
      return false;

    } catch (err) {
      console.error('[useGanSigner] Error:', err);
      
      if (err.message?.includes('rejected') || err.message?.includes('cancelled')) {
        setStatus('needs_consent');
        setError('Consent required to enable GAN transactions');
      } else {
        setStatus('error');
        setError(err.message);
      }
      return false;
    }
  }, [embeddedWallet]);

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
