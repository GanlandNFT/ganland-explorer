'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// GAN's key quorum ID - allows GAN to sign transactions on behalf of users
const GAN_SIGNER_ID = 'cxz88rx36g27l2eo8fgwo6h8';

export default function SignerManager({ children }) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [signerStatus, setSignerStatus] = useState('pending'); // pending | checking | adding | added | error | unavailable
  const [hasAttempted, setHasAttempted] = useState(false);

  const addGanSigner = useCallback(async (embeddedWallet) => {
    if (hasAttempted) return;
    setHasAttempted(true);
    
    try {
      console.log('[SignerManager] Checking wallet:', embeddedWallet.address);
      setSignerStatus('checking');

      // Check if wallet already has delegation enabled
      // Wallets created via API with additional_signers have delegated: true
      if (embeddedWallet.delegated === true) {
        console.log('[SignerManager] ✅ GAN signer already active (delegated: true)');
        setSignerStatus('added');
        return;
      }

      // For wallets created via web login, we need to add the signer
      // This requires useSigners hook - check if it's available
      console.log('[SignerManager] Wallet needs signer addition (delegated:', embeddedWallet.delegated, ')');
      
      // The addSigners method may be available on the wallet object itself
      // depending on Privy SDK version
      if (typeof embeddedWallet.addSigners === 'function') {
        setSignerStatus('adding');
        console.log('[SignerManager] Adding GAN signer via wallet.addSigners...');
        
        await embeddedWallet.addSigners({
          signers: [{ signerId: GAN_SIGNER_ID }]
        });
        
        console.log('[SignerManager] ✅ GAN signer added successfully');
        setSignerStatus('added');
      } else {
        // Method not available - user needs to use SignerSetup component
        console.log('[SignerManager] addSigners not available - need manual setup');
        setSignerStatus('unavailable');
      }
    } catch (error) {
      console.error('[SignerManager] Error:', error.message);
      
      // User may have declined consent
      if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
        setSignerStatus('pending');
        setHasAttempted(false); // Allow retry
      } else {
        setSignerStatus('error');
      }
    }
  }, [hasAttempted]);

  useEffect(() => {
    if (!ready || !authenticated) {
      setSignerStatus('pending');
      setHasAttempted(false);
      return;
    }

    // Find the Privy embedded wallet
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    
    if (!embeddedWallet) {
      console.log('[SignerManager] Waiting for embedded wallet...');
      return;
    }

    addGanSigner(embeddedWallet);
  }, [ready, authenticated, wallets, addGanSigner]);

  return (
    <>
      {children}
      
      {/* Dev indicator */}
      {process.env.NODE_ENV === 'development' && signerStatus !== 'pending' && (
        <div className={`fixed bottom-4 left-4 text-xs px-2 py-1 rounded z-50 ${
          signerStatus === 'added' ? 'bg-green-900/80 text-green-400' :
          signerStatus === 'error' ? 'bg-red-900/80 text-red-400' :
          signerStatus === 'unavailable' ? 'bg-yellow-900/80 text-yellow-400' :
          'bg-gray-900/80 text-gray-400'
        }`}>
          GAN Signer: {signerStatus}
        </div>
      )}
    </>
  );
}
