'use client';

import { useEffect, useState, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Handles delegation consent on first login
 * The user must approve adding GAN as a signer to their wallet
 */
export default function GanSignerSetup() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [showPrompt, setShowPrompt] = useState(false);
  const [status, setStatus] = useState('idle');
  const checkedRef = useRef(false);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated || !embeddedWallet) return;
    if (checkedRef.current) return;
    checkedRef.current = true;
    
    console.log('[GAN] Checking delegation status...');
    console.log('[GAN] Wallet delegated:', embeddedWallet.delegated);
    
    // If not delegated, show prompt (user needs to consent)
    if (!embeddedWallet.delegated) {
      console.log('[GAN] Needs delegation consent');
      setShowPrompt(true);
    } else {
      console.log('[GAN] Already delegated ✅');
    }
  }, [ready, authenticated, embeddedWallet]);

  async function requestDelegation() {
    setStatus('processing');
    
    try {
      console.log('[GAN] Requesting delegation...');
      
      // The wallet object should have a delegate method
      if (embeddedWallet.delegate) {
        await embeddedWallet.delegate();
        console.log('[GAN] Delegation successful ✅');
        setShowPrompt(false);
        setStatus('success');
      } else {
        console.log('[GAN] delegate() method not available on wallet');
        console.log('[GAN] Wallet methods:', Object.keys(embeddedWallet));
        setStatus('error');
      }
    } catch (err) {
      console.error('[GAN] Delegation error:', err);
      setStatus('error');
    }
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gan-yellow/30 rounded-xl p-6 max-w-md w-full">
        <div className="text-center mb-4">
          <span className="text-4xl">🤖</span>
        </div>
        <h3 className="text-xl font-bold text-gan-yellow text-center mb-2">
          Enable GAN Transactions
        </h3>
        <p className="text-gray-400 text-center text-sm mb-6">
          Allow GAN to mint NFTs and execute transactions on your behalf. 
          You can revoke this permission anytime.
        </p>
        
        {status === 'error' && (
          <p className="text-red-400 text-center text-sm mb-4">
            Failed to enable. Please try again.
          </p>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowPrompt(false)}
            className="flex-1 px-4 py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors"
            disabled={status === 'processing'}
          >
            Skip
          </button>
          <button
            onClick={requestDelegation}
            className="flex-1 px-4 py-3 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors disabled:opacity-50"
            disabled={status === 'processing'}
          >
            {status === 'processing' ? 'Enabling...' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}
