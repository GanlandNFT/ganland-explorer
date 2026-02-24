'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Prompts user to enable GAN as a signer via API
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const attemptedRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  // Find the embedded wallet
  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet || dismissed) {
      return;
    }

    // Don't re-attempt if already done
    if (attemptedRef.current) return;

    checkSignerStatus();
  }, [ready, authenticated, embeddedWallet, dismissed]);

  async function checkSignerStatus() {
    attemptedRef.current = true;
    setStatus('checking');

    try {
      // Check via API
      const token = await getAccessToken();
      const response = await fetch('/api/gan-signer', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('[GanSignerSetup] Status check:', data);

      if (data.enabled) {
        console.log('[GanSignerSetup] ✅ Already enabled');
        setStatus('complete');
      } else {
        console.log('[GanSignerSetup] Needs setup');
        setStatus('needs_setup');
      }
    } catch (err) {
      console.error('[GanSignerSetup] Check error:', err);
      setStatus('needs_setup');
    }
  }

  async function addGanSigner() {
    setStatus('adding');
    setError(null);

    try {
      const token = await getAccessToken();
      
      console.log('[GanSignerSetup] Adding GAN signer via API...');
      
      const response = await fetch('/api/gan-signer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: embeddedWallet?.address,
        }),
      });

      const data = await response.json();
      console.log('[GanSignerSetup] API response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      console.log('[GanSignerSetup] ✅ Signer added');
      setStatus('complete');

    } catch (err) {
      console.error('[GanSignerSetup] Error:', err);
      
      if (err.message?.includes('rejected') || err.message?.includes('cancelled')) {
        setStatus('needs_setup');
        attemptedRef.current = false;
      } else {
        setError(err.message);
        setStatus('needs_setup');
      }
    }
  }

  // Don't render if not logged in, already complete, or dismissed
  if (!authenticated || status === 'complete' || status === 'idle' || dismissed) {
    return null;
  }

  // Show setup prompt
  if (status === 'needs_setup') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gan-yellow/30 rounded-lg p-4 max-w-sm shadow-xl z-50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div className="flex-1">
            <h4 className="font-bold text-gan-yellow mb-1">Enable GAN Transactions</h4>
            <p className="text-sm text-gray-400 mb-3">
              Allow GAN to mint NFTs and execute transactions on your behalf.
            </p>
            {error && (
              <p className="text-xs text-red-400 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={addGanSigner}
                className="px-4 py-2 bg-gan-yellow text-black font-bold rounded-lg text-sm hover:bg-gan-gold transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-2 text-gray-400 text-sm hover:text-white transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (status === 'checking' || status === 'adding') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl z-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-gan-yellow border-t-transparent rounded-full" />
          <span className="text-sm text-gray-400">
            {status === 'checking' ? 'Checking...' : 'Enabling GAN...'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
