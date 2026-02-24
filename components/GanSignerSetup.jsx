'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

/**
 * GanSignerSetup - Creates wallet with GAN signer at creation time
 * 
 * Since we disabled auto-creation, we create wallets via API
 * with GAN's key quorum already attached as a signer.
 * No delegation prompt needed - ToS covers consent.
 */
export default function GanSignerSetup() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const attemptedRef = useRef(false);
  const [walletAddress, setWalletAddress] = useState(null);

  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (attemptedRef.current) return;
    
    // If user already has embedded wallet, we're done
    if (embeddedWallet) {
      console.log('[GAN] ✅ Wallet exists:', embeddedWallet.address);
      setWalletAddress(embeddedWallet.address);
      return;
    }
    
    attemptedRef.current = true;
    
    // Create wallet with GAN signer
    (async () => {
      try {
        console.log('[GAN] Creating wallet with GAN signer...');
        
        const token = await getAccessToken();
        const response = await fetch('/api/create-wallet', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        if (response.ok) {
          console.log('[GAN] ✅ Wallet created with GAN signer:', result.wallet);
          setWalletAddress(result.wallet);
          // Reload to refresh wallet list
          if (!result.existing) {
            window.location.reload();
          }
        } else {
          console.log('[GAN] Wallet creation failed:', result.error);
          attemptedRef.current = false;
        }
      } catch (err) {
        console.log('[GAN] Error:', err.message);
        attemptedRef.current = false;
      }
    })();
  }, [ready, authenticated, embeddedWallet, getAccessToken]);

  return null;
}
