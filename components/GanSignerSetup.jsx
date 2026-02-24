'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy, useWallets, useDelegatedActions } from '@privy-io/react-auth';

export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const delegatedActions = useDelegatedActions();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const checkedRef = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || dismissed) return;
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    console.log('[GanSignerSetup] wallets:', wallets);
    console.log('[GanSignerSetup] embeddedWallet:', embeddedWallet);
    console.log('[GanSignerSetup] delegatedActions:', delegatedActions);
    console.log('[GanSignerSetup] delegateWallet fn:', typeof delegatedActions?.delegateWallet);
    
    if (!embeddedWallet) {
      console.log('[GanSignerSetup] No embedded wallet yet');
      setStatus('no_wallet');
      return;
    }
    
    if (embeddedWallet.delegated) {
      console.log('[GanSignerSetup] Already delegated!');
      setStatus('complete');
      return;
    }
    
    setStatus('needs_setup');
  }, [ready, authenticated, embeddedWallet, dismissed, wallets, delegatedActions]);

  async function enableDelegation() {
    setStatus('adding');
    setError(null);

    try {
      console.log('[GanSignerSetup] Starting delegation...');
      console.log('[GanSignerSetup] delegatedActions object:', delegatedActions);
      
      const { delegateWallet } = delegatedActions || {};
      
      if (!delegateWallet) {
        throw new Error('delegateWallet not available. Make sure "Delegated Actions" is enabled in Privy Dashboard → Embedded Wallets settings.');
      }
      
      if (!embeddedWallet) {
        throw new Error('No embedded wallet found');
      }

      console.log('[GanSignerSetup] Calling delegateWallet for:', embeddedWallet.address);
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delegation timed out after 30s. Check Privy Dashboard config.')), 30000)
      );
      
      const delegatePromise = delegateWallet({
        address: embeddedWallet.address,
      });
      
      const result = await Promise.race([delegatePromise, timeoutPromise]);
      
      console.log('[GanSignerSetup] Delegation result:', result);
      setStatus('complete');

    } catch (err) {
      console.error('[GanSignerSetup] Error:', err);
      setError(err.message || 'Delegation failed');
      setStatus('needs_setup');
      checkedRef.current = false;
    }
  }

  // Don't show anything if complete, dismissed, or checking
  if (status === 'complete' || status === 'idle' || dismissed) {
    return null;
  }
  
  if (status === 'no_wallet') {
    return null; // No wallet yet, wait
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
              <p className="text-xs text-red-400 mb-2 break-words">{error}</p>
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

  if (status === 'adding') {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm shadow-xl z-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-gan-yellow border-t-transparent rounded-full" />
          <span className="text-sm text-gray-400">Enabling GAN... (may take a moment)</span>
        </div>
      </div>
    );
  }

  return null;
}
