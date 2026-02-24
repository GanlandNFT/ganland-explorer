'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy, useWallets, useDelegatedActions } from '@privy-io/react-auth';

export default function GanSignerSetup() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const { delegateWallet } = useDelegatedActions();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const checkedRef = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet || dismissed) return;
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    // Log wallet info for debugging
    console.log('[GanSignerSetup] Wallet object:', embeddedWallet);
    console.log('[GanSignerSetup] Wallet address:', embeddedWallet.address);
    console.log('[GanSignerSetup] delegateWallet available:', !!delegateWallet);
    
    // Check if already delegated
    if (embeddedWallet.delegated) {
      console.log('[GanSignerSetup] Already delegated!');
      setStatus('complete');
      return;
    }
    
    setStatus('needs_setup');
  }, [ready, authenticated, embeddedWallet, dismissed, delegateWallet]);

  async function enableDelegation() {
    setStatus('adding');
    setError(null);

    try {
      console.log('[GanSignerSetup] Starting delegation via SDK...');
      
      if (!delegateWallet) {
        throw new Error('Delegation not available. Enable "Delegated Actions" in Privy Dashboard.');
      }
      
      if (!embeddedWallet) {
        throw new Error('No embedded wallet found');
      }

      // Use Privy's built-in delegation!
      // This should prompt the user and enable delegation without needing wallet ID
      const result = await delegateWallet({
        address: embeddedWallet.address,
      });
      
      console.log('[GanSignerSetup] Delegation result:', result);
      setStatus('complete');

    } catch (err) {
      console.error('[GanSignerSetup] Delegation error:', err);
      setError(err.message || 'Delegation failed');
      setStatus('needs_setup');
      checkedRef.current = false;
    }
  }

  if (!authenticated || status === 'complete' || status === 'idle' || dismissed) {
    return null;
  }

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
                onClick={enableDelegation}
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

  if (status === 'checking' || status === 'adding') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl z-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-gan-yellow border-t-transparent rounded-full" />
          <span className="text-sm text-gray-400">
            {status === 'adding' ? 'Enabling GAN...' : 'Checking...'}
          </span>
        </div>
      </div>
    );
  }

  return null;
}
