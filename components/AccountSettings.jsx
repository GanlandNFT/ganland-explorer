'use client';

import { useState } from 'react';
import { usePrivy, useLinkAccount } from '@privy-io/react-auth';

export default function AccountSettings({ isOpen, onClose }) {
  const { user, unlinkEmail, unlinkTwitter, unlinkDiscord, unlinkFarcaster, unlinkWallet } = usePrivy();
  const { linkEmail, linkTwitter, linkDiscord, linkFarcaster, linkWallet } = useLinkAccount();
  const [isLinking, setIsLinking] = useState(null);

  if (!isOpen || !user) return null;

  // Get linked accounts
  const linkedEmail = user.email?.address;
  const linkedTwitter = user.twitter?.username;
  const linkedDiscord = user.discord?.username;
  const linkedFarcaster = user.farcaster?.username;
  const linkedWallets = user.linkedAccounts?.filter(a => a.type === 'wallet') || [];
  const embeddedWallet = user.wallet?.address;

  const handleLink = async (type) => {
    setIsLinking(type);
    try {
      switch (type) {
        case 'email': await linkEmail(); break;
        case 'twitter': await linkTwitter(); break;
        case 'discord': await linkDiscord(); break;
        case 'farcaster': await linkFarcaster(); break;
        case 'wallet': await linkWallet(); break;
      }
    } catch (e) {
      console.error(`Failed to link ${type}:`, e);
    }
    setIsLinking(null);
  };

  const handleUnlink = async (type) => {
    setIsLinking(type);
    try {
      switch (type) {
        case 'email': await unlinkEmail(linkedEmail); break;
        case 'twitter': await unlinkTwitter(user.twitter?.subject); break;
        case 'discord': await unlinkDiscord(user.discord?.subject); break;
        case 'farcaster': await unlinkFarcaster(user.farcaster?.fid); break;
      }
    } catch (e) {
      console.error(`Failed to unlink ${type}:`, e);
    }
    setIsLinking(null);
  };

  const AccountRow = ({ label, value, linked, type, canUnlink = true }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: '1px solid #222'
    }}>
      <div>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '0.85rem', color: linked ? '#5ce1e6' : '#666' }}>
          {linked ? value : 'Not linked'}
        </div>
      </div>
      <button
        onClick={() => linked && canUnlink ? handleUnlink(type) : handleLink(type)}
        disabled={isLinking === type}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 600,
          fontSize: '0.85rem',
          cursor: isLinking === type ? 'wait' : 'pointer',
          background: linked ? (canUnlink ? 'rgba(239, 68, 68, 0.2)' : '#333') : 'rgba(92, 225, 230, 0.2)',
          color: linked ? (canUnlink ? '#ef4444' : '#666') : '#5ce1e6',
        }}
      >
        {isLinking === type ? '...' : linked ? (canUnlink ? 'Unlink' : 'Linked') : 'Link'}
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
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#111',
        borderRadius: '16px',
        border: '1px solid #222',
        maxWidth: '450px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: '24px'
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
              Your Wallet
            </div>
            <div style={{ fontFamily: '"Share Tech Mono", monospace', color: '#d4a84b', fontSize: '0.9rem', wordBreak: 'break-all' }}>
              {embeddedWallet}
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
            value={linkedDiscord}
            linked={!!linkedDiscord}
            type="discord"
          />
          
          <AccountRow 
            label="Farcaster" 
            value={linkedFarcaster ? `@${linkedFarcaster}` : null}
            linked={!!linkedFarcaster}
            type="farcaster"
          />
        </div>

        {/* Link External Wallet */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '12px' }}>
            External Wallets
          </div>
          
          {linkedWallets.length > 0 ? (
            linkedWallets.map((w, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                background: '#0a0a0a',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#888' }}>
                  🦊 {w.address?.slice(0,6)}...{w.address?.slice(-4)}
                </span>
                <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Linked</span>
              </div>
            ))
          ) : (
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
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {isLinking === 'wallet' ? 'Connecting...' : '+ Link MetaMask or other wallet'}
            </button>
          )}
        </div>

        {/* Footer note */}
        <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '24px', textAlign: 'center' }}>
          Link accounts to recover access if you lose one method
        </p>
      </div>
    </div>
  );
}
