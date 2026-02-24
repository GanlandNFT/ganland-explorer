'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * Hook to manage GAN signer status for the user's embedded wallet
 * 
 * Uses server-side API to add GAN as a signer on the wallet,
 * enabling GAN to execute transactions on behalf of the user.
 */
export function useGanSigner() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle');
  const [isGanEnabled, setIsGanEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Find embedded wallet
  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  // Check signer status via API
  const checkStatus = useCallback(async () => {
    if (!ready || !authenticated || !embeddedWallet) {
      setStatus('idle');
      return;
    }
    
    setStatus('checking');
    setError(null);
    
    try {
      const token = await getAccessToken();
      
      const response = await fetch('/api/gan-signer', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.enabled) {
        setIsGanEnabled(true);
        setStatus('ready');
        console.log('[useGanSigner] ✅ GAN signer is enabled');
      } else {
        setIsGanEnabled(false);
        setStatus('needs_consent');
        console.log('[useGanSigner] GAN signer not enabled:', data.reason);
      }
    } catch (err) {
      console.error('[useGanSigner] Check error:', err);
      // Don't show error for check failures - just mark as needing setup
      setStatus('needs_consent');
    }
  }, [ready, authenticated, embeddedWallet, getAccessToken]);

  // Add GAN as signer via API
  const addGanSigner = useCallback(async () => {
    if (!embeddedWallet) {
      setError('No embedded wallet found. Please log in with X or email.');
      return false;
    }

    setStatus('adding');
    setError(null);

    try {
      const token = await getAccessToken();
      
      console.log('[useGanSigner] Adding GAN signer via API...');
      
      const response = await fetch('/api/gan-signer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: embeddedWallet.address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[useGanSigner] API error:', data);
        throw new Error(data.error || 'Failed to enable GAN signer');
      }

      console.log('[useGanSigner] ✅ GAN signer enabled:', data);
      setIsGanEnabled(true);
      setStatus('ready');
      return true;

    } catch (err) {
      console.error('[useGanSigner] Error:', err);
      setError(err.message || 'Failed to enable GAN signer');
      setStatus('error');
      return false;
    }
  }, [embeddedWallet, getAccessToken]);

  // Auto-check on wallet change
  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      // Check local storage cache first
      const cached = localStorage.getItem(`gan_signer_${embeddedWallet.address}`);
      if (cached === 'enabled') {
        setIsGanEnabled(true);
        setStatus('ready');
      } else {
        checkStatus();
      }
    } else if (ready && !authenticated) {
      setStatus('idle');
      setIsGanEnabled(false);
      setError(null);
    }
  }, [ready, authenticated, embeddedWallet, checkStatus]);

  // Cache enabled status
  useEffect(() => {
    if (isGanEnabled && embeddedWallet?.address) {
      localStorage.setItem(`gan_signer_${embeddedWallet.address}`, 'enabled');
    }
  }, [isGanEnabled, embeddedWallet?.address]);

  return {
    status,
    isGanEnabled,
    addGanSigner,
    error,
    walletAddress: embeddedWallet?.address,
    checkStatus,
  };
}

export default useGanSigner;
// Build: 1771912733
