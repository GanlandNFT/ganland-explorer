'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// GAN's key quorum ID - created via Privy API
// This allows GAN to sign transactions on behalf of users for minting, transfers, etc.
const GAN_KEY_QUORUM_ID = 'cxz88rx36g27l2eo8fgwo6h8';

/**
 * GanSignerSetup - Automatically adds GAN as a signer to user's embedded wallet
 * 
 * This component should be rendered after login. It:
 * 1. Detects when user has an embedded wallet
 * 2. Checks if GAN is already a signer
 * 3. If not, prompts user to add GAN (with consent modal)
 * 
 * For wallets created via X timeline (@GanlandNFT create wallet),
 * GAN is added at creation time, so this is a no-op.
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [status, setStatus] = useState('idle'); // idle | checking | needs_setup | adding | complete | error
  const [error, setError] = useState(null);
  const attemptedRef = useRef(false);

  // Find the embedded wallet
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) {
      return;
    }

    // Don't re-attempt if already done
    if (attemptedRef.current) return;

    checkSignerStatus();
  }, [ready, authenticated, embeddedWallet]);

  async function checkSignerStatus() {
    attemptedRef.current = true;
    setStatus('checking');

    try {
      // Check if wallet has delegated: true (GAN can already sign)
      if (embeddedWallet.delegated === true) {
        console.log('[GanSigner] ✅ Already set up - GAN can sign transactions');
        setStatus('complete');
        return;
      }

      // Wallet doesn't have GAN as signer yet
      console.log('[GanSigner] Wallet needs GAN signer setup');
      setStatus('needs_setup');

      // Auto-attempt to add if the method is available
      // This will trigger Privy's consent modal
      await addGanSigner();

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
      // Try using the wallet's addSigners method if available
      if (typeof embeddedWallet.addSigners === 'function') {
        await embeddedWallet.addSigners({
          signers: [{
            signerId: GAN_KEY_QUORUM_ID,
            // Optional: Add policy restrictions here
            // policyIds: ['policy-id-for-minting-only']
          }]
        });
        
        console.log('[GanSigner] ✅ GAN signer added successfully');
        setStatus('complete');
        return;
      }

      // Fallback: Try importing useSigners dynamically
      // This handles different Privy SDK versions
      try {
        const { useSigners } = await import('@privy-io/react-auth');
        // Note: hooks can't be called dynamically, this is just for documentation
        // The actual implementation would need to be in a parent component
        console.log('[GanSigner] useSigners hook available but needs component refactor');
        setStatus('needs_setup');
      } catch {
        console.log('[GanSigner] useSigners not available in this SDK version');
        setStatus('needs_setup');
      }

    } catch (err) {
      console.error('[GanSigner] Error adding signer:', err);
      
      if (err.message?.includes('rejected') || err.message?.includes('cancelled')) {
        // User cancelled - allow retry
        setStatus('needs_setup');
        attemptedRef.current = false;
      } else {
        setError(err.message);
        setStatus('error');
      }
    }
  }

  // Don't render anything if not logged in or already complete
  if (!authenticated || status === 'complete' || status === 'idle') {
    return null;
  }

  // Show setup prompt if needed
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
            <div className="flex gap-2">
              <button
                onClick={addGanSigner}
                className="px-4 py-2 bg-gan-yellow text-black font-bold rounded-lg text-sm hover:bg-gan-gold transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => setStatus('complete')}
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
            {status === 'checking' ? 'Checking signer status...' : 'Adding GAN as signer...'}
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
