'use client';

import { useState } from 'react';
import { usePrivy, useLinkAccount, useWallets } from '@privy-io/react-auth';

export default function AccountSettings({ isOpen, onClose }) {
  const { user, unlinkEmail, unlinkTwitter, unlinkWallet } = usePrivy();
  const { linkEmail, linkTwitter, linkWallet } = useLinkAccount();
  const { wallets } = useWallets();
  const [isLinking, setIsLinking] = useState(null);

  if (!isOpen || !user) return null;

  // Get linked accounts
  const linkedEmail = user.email?.address;
  const linkedTwitter = user.twitter?.username;
  
  // Get embedded wallet (Privy-created)
  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');
  
  // Get external wallets (MetaMask, WalletConnect, etc.) - NOT the embedded one
  const externalWallets = wallets?.filter(w => w.walletClientType !== 'privy') || [];

  const handleLink = async (type) => {
    setIsLinking(type);
    try {
      switch (type) {
        case 'email': await linkEmail(); break;
        case 'twitter': await linkTwitter(); break;
        case 'wallet': await linkWallet(); break;
      }
    } catch (e) {
      console.error(`Failed to link ${type}:`, e);
    }
    setIsLinking(null);
  };

  const handleUnlink = async (type, data) => {
    setIsLinking(type);
    try {
      switch (type) {
        case 'email': await unlinkEmail(linkedEmail); break;
        case 'twitter': await unlinkTwitter(user.twitter?.subject); break;
        case 'wallet': 
          if (data?.address) {
            await unlinkWallet(data.address);
          }
          break;
      }
    } catch (e) {
      console.error(`Failed to unlink ${type}:`, e);
    }
    setIsLinking(null);
  };

  const handleDisconnectExternalWallet = async (walletToDisconnect) => {
    setIsLinking('external-' + walletToDisconnect.address);
    try {
      // First try to disconnect the wallet connection
      if (walletToDisconnect.disconnect) {
        await walletToDisconnect.disconnect();
      }
      // Also unlink it from the Privy account if possible
      if (unlinkWallet && walletToDisconnect.address) {
        await unlinkWallet(walletToDisconnect.address);
      }
      
      // Try to revoke browser wallet permissions (MetaMask, etc.)
      // This fully disconnects the wallet from the browser
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          });
          console.log('Browser wallet permissions revoked');
        } catch (revokeError) {
          // wallet_revokePermissions not supported by all wallets
          // User may need to manually disconnect via extension
          console.log('wallet_revokePermissions not supported:', revokeError.message);
        }
      }
    } catch (e) {
      console.error('Failed to disconnect wallet:', e);
    }
    setIsLinking(null);
  };

  const AccountRow = ({ label, value, linked, type, canUnlink = true, comingSoon = false }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #222',
      opacity: comingSoon ? 0.5 : 1
    }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          {label}
          {comingSoon && <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '8px' }}>Coming Soon</span>}
        </div>
        <div style={{ fontSize: '0.85rem', color: linked ? '#5ce1e6' : '#666' }}>
          {linked ? value : 'Not linked'}
        </div>
      </div>
      <button
        onClick={() => !comingSoon && (linked && canUnlink ? handleUnlink(type) : handleLink(type))}
        disabled={isLinking === type || comingSoon}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: comingSoon ? 'not-allowed' : (isLinking === type ? 'wait' : 'pointer'),
          background: comingSoon ? '#1a1a1a' : linked ? (canUnlink ? 'rgba(239, 68, 68, 0.2)' : '#222') : 'rgba(92, 225, 230, 0.2)',
          color: comingSoon ? '#444' : linked ? (canUnlink ? '#ef4444' : '#555') : '#5ce1e6',
        }}
      >
        {comingSoon ? 'Soon' : isLinking === type ? '...' : linked ? (canUnlink ? 'Unlink' : 'Linked') : 'Link'}
      </button>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      height: '100dvh', /* iOS Safari - dynamic viewport */
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      paddingBottom: 'env(safe-area-inset-bottom, 20px)', /* iOS safe area */
    }} onClick={onClose}>
      <div style={{
        background: '#111',
        borderRadius: '16px',
        border: '1px solid #222',
        maxWidth: '450px',
        width: '100%',
        maxHeight: '80dvh', /* iOS Safari - dynamic viewport */
        overflow: 'auto',
        padding: '24px',
        marginBottom: 'env(safe-area-inset-bottom, 0px)', /* iOS safe area */
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Account Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >×</button>
        </div>

        {/* Embedded Wallet */}
        {embeddedWallet && (
          <div style={{
            background: 'rgba(212, 168, 75, 0.1)',
            border: '1px solid rgba(212, 168, 75, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '8px' }}>
              🔐 Your Embedded Wallet
            </div>
            <div style={{ fontFamily: '"Share Tech Mono", monospace', color: '#d4a84b', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {embeddedWallet.address}
            </div>
          </div>
        )}

        {/* Social Accounts */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '8px' }}>
            Linked Accounts
          </div>
          
          <AccountRow 
            label="X (Twitter)" 
            value={linkedTwitter ? `@${linkedTwitter}` : null}
            linked={!!linkedTwitter}
            type="twitter"
            canUnlink={!!linkedEmail} // Can only unlink if email is also linked
          />
          
          <AccountRow 
            label="Email" 
            value={linkedEmail}
            linked={!!linkedEmail}
            type="email"
            canUnlink={!!linkedTwitter} // Can only unlink if twitter is also linked
          />
          
          <AccountRow 
            label="Discord" 
            value={null}
            linked={false}
            type="discord"
            comingSoon={true}
          />
          
          <AccountRow 
            label="Farcaster" 
            value={null}
            linked={false}
            type="farcaster"
            comingSoon={true}
          />
        </div>

        {/* External Wallets */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '12px' }}>
            🦊 External Wallets
          </div>
          
          {/* Show linked external wallets with disconnect option */}
          {externalWallets.map((wallet, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px',
              background: '#0a0a0a',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #222'
            }}>
              <div>
                <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.9rem', color: '#5ce1e6' }}>
                  {wallet.address?.slice(0,6)}...{wallet.address?.slice(-4)}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#555', marginLeft: '8px' }}>
                  ({wallet.walletClientType || 'External'})
                </span>
              </div>
              <button
                onClick={() => handleDisconnectExternalWallet(wallet)}
                disabled={isLinking === 'external-' + wallet.address}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: isLinking === 'external-' + wallet.address ? 'wait' : 'pointer',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  opacity: isLinking === 'external-' + wallet.address ? 0.5 : 1,
                }}
              >
                {isLinking === 'external-' + wallet.address ? '...' : 'Disconnect'}
              </button>
            </div>
          ))}
          
          {/* Add external wallet button */}
          <button
            onClick={() => handleLink('wallet')}
            disabled={isLinking === 'wallet'}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: '1px dashed #333',
              background: 'transparent',
              color: '#888',
              cursor: isLinking === 'wallet' ? 'wait' : 'pointer',
              fontSize: '0.9rem',
              marginTop: externalWallets.length > 0 ? '8px' : '0'
            }}
          >
            {isLinking === 'wallet' ? 'Connecting...' : '+ Link MetaMask or other wallet'}
          </button>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '24px', textAlign: 'center' }}>
          Link accounts to recover access if you lose one method
        </p>
      </div>
    </div>
  );
}
