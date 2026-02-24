'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// GAN's key quorum ID - created via Privy API
const GAN_KEY_QUORUM_ID = 'cxz88rx36g27l2eo8fgwo6h8';

/**
 * GanSignerSetup - Automatically prompts user to enable GAN as a signer
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const attemptedRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  // Find the embedded wallet
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

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
      // Check if wallet has delegation enabled
      if (embeddedWallet.delegated === true) {
        console.log('[GanSigner] ✅ Already set up - GAN can sign transactions');
        setStatus('complete');
        return;
      }

      // Wallet doesn't have GAN as signer yet
      console.log('[GanSigner] Wallet needs GAN signer setup');
      setStatus('needs_setup');

    } catch (err) {
      console.error('[GanSigner] Error checking status:', err);
      setError(err.message);
      setStatus('error');
    }
  }

  async function addGanSigner() {
    setStatus('adding');
    setError(null);

    try {
      // Try delegate() method first (Privy SDK >= 1.80)
      if (typeof embeddedWallet.delegate === 'function') {
        console.log('[GanSigner] Using delegate()...');
        await embeddedWallet.delegate({
          chainType: 'ethereum',
        });
        console.log('[GanSigner] ✅ Delegation enabled');
        setStatus('complete');
        return;
      }

      // Try addSigners() as fallback
      if (typeof embeddedWallet.addSigners === 'function') {
        console.log('[GanSigner] Using addSigners()...');
        await embeddedWallet.addSigners({
          signers: [{ signerId: GAN_KEY_QUORUM_ID }]
        });
        console.log('[GanSigner] ✅ Signer added');
        setStatus('complete');
        return;
      }

      // Log available methods for debugging
      const methods = Object.keys(embeddedWallet).filter(k => typeof embeddedWallet[k] === 'function');
      console.log('[GanSigner] Available wallet methods:', methods);

      setError('Signer setup not available. Check console for details.');
      setStatus('needs_setup');

    } catch (err) {
      console.error('[GanSigner] Error:', err);
      
      if (err.message?.includes('rejected') || err.message?.includes('cancelled') || err.message?.includes('denied')) {
        setStatus('needs_setup');
        attemptedRef.current = false;
      } else {
        setError(err.message);
        setStatus('error');
      }
    }
  }

  // Don't render if not logged in, already complete, or dismissed
  if (!authenticated || status === 'complete' || status === 'idle' || dismissed) {
    return null;
  }

  // Show setup prompt
  if (status === 'needs_setup') {
    const isUnavailable = error?.includes('not available');
    
    return (
      <div className={`fixed bottom-4 right-4 bg-gray-900 border ${isUnavailable ? 'border-red-500/30' : 'border-gan-yellow/30'} rounded-lg p-4 max-w-sm shadow-xl z-50`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div className="flex-1">
            <h4 className={`font-bold ${isUnavailable ? 'text-red-400' : 'text-gan-yellow'} mb-1`}>
              Enable GAN Transactions
            </h4>
            <p className="text-sm text-gray-400 mb-3">
              Allow GAN to mint NFTs and execute transactions on your behalf.
            </p>
            {isUnavailable ? (
              <p className="text-xs text-red-400 mb-2">
                Signer setup not available. Check console for details.
              </p>
            ) : error && (
              <p className="text-xs text-red-400 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={addGanSigner}
                disabled={isUnavailable}
                className={`px-4 py-2 font-bold rounded-lg text-sm transition-colors ${
                  isUnavailable 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gan-yellow text-black hover:bg-gan-gold'
                }`}
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

  // Show error
  if (status === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-red-500/30 rounded-lg p-4 max-w-sm shadow-xl z-50">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h4 className="font-bold text-red-400 mb-1">Setup Error</h4>
            <p className="text-sm text-gray-400 mb-2">{error}</p>
            <button
              onClick={() => {
                attemptedRef.current = false;
                checkSignerStatus();
              }}
              className="text-sm text-gan-yellow hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
