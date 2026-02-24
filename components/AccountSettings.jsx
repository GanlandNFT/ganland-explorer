'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useLinkAccount, useWallets } from '@privy-io/react-auth';
import { useGanSigner } from '../hooks/useGanSigner';

// Generate a short referral code from user ID
function generateReferralCode(userId) {
  if (!userId) return null;
  // Take last 8 chars of user ID, uppercase
  const hash = userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  return `GAN-${hash}`;
}

export default function AccountSettings({ isOpen, onClose }) {
  const { user, unlinkEmail, unlinkTwitter } = usePrivy();
  const { linkEmail, linkTwitter } = useLinkAccount({
    onSuccess: (user, linkedAccount) => {
      console.log('Successfully linked:', linkedAccount);
      setIsLinking(null);
      setToast({ message: `Successfully linked ${linkedAccount.type}`, type: 'success' });
    },
    onError: (error) => {
      console.error('Link error:', error);
      setIsLinking(null);
      setToast({ message: 'Failed to link account', type: 'error' });
    }
  });
  const { wallets } = useWallets();
  const { isGanEnabled, status: signerStatus, addGanSigner, error: signerError } = useGanSigner();
  const [isLinking, setIsLinking] = useState(null);
  const [toast, setToast] = useState(null);
  const [referralStats, setReferralStats] = useState({ points: 0, referrals: 0 });
  const [copied, setCopied] = useState(false);
  const [togglingGan, setTogglingGan] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Generate referral code
  const referralCode = generateReferralCode(user?.id);
  const referralLink = referralCode ? `https://ganland.ai?ref=${referralCode}` : null;

  // Copy referral link
  const handleCopyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  if (!isOpen || !user) return null;

  // Get linked accounts
  const linkedEmail = user.email?.address;
  const linkedTwitter = user.twitter?.username;
  
  // Get embedded wallet (Privy-created)
  const embeddedWallet = wallets?.find(w => w.walletClientType === 'privy');

  const handleLink = async (type) => {
    setIsLinking(type);
    try {
      switch (type) {
        case 'email': 
          await linkEmail(); 
          break;
        case 'twitter': 
          await linkTwitter(); 
          break;
      }
    } catch (e) {
      console.error(`Failed to link ${type}:`, e);
      setIsLinking(null);
    }
  };

  const handleUnlink = async (type) => {
    setIsLinking(type);
    try {
      switch (type) {
        case 'email': await unlinkEmail(linkedEmail); break;
        case 'twitter': await unlinkTwitter(user.twitter?.subject); break;
      }
      setToast({ message: `Unlinked ${type}`, type: 'success' });
    } catch (e) {
      console.error(`Failed to unlink ${type}:`, e);
      setToast({ message: `Failed to unlink ${type}`, type: 'error' });
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
      height: '100dvh',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      paddingBottom: 'env(safe-area-inset-bottom, 20px)',
    }} onClick={onClose}>
      <div style={{
        background: '#111',
        borderRadius: '16px',
        border: '1px solid #222',
        maxWidth: '450px',
        width: '100%',
        maxHeight: '80dvh',
        overflow: 'auto',
        padding: '24px',
        marginBottom: 'env(safe-area-inset-bottom, 0px)',
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
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '8px' }}>
            Linked Accounts
          </div>
          
          <AccountRow 
            label="X (Twitter)" 
            value={linkedTwitter ? `@${linkedTwitter}` : null}
            linked={!!linkedTwitter}
            type="twitter"
            canUnlink={!!linkedEmail}
          />
          
          <AccountRow 
            label="Email" 
            value={linkedEmail}
            linked={!!linkedEmail}
            type="email"
            canUnlink={!!linkedTwitter}
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

        {/* GAN Agent Settings */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '8px' }}>
            🤖 GAN Agent Settings
          </div>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px' }}>
            Control whether GAN can execute transactions on your behalf
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: isGanEnabled ? 'rgba(16, 185, 129, 0.1)' : signerStatus === 'unavailable' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isGanEnabled ? 'rgba(16, 185, 129, 0.3)' : signerStatus === 'unavailable' ? 'rgba(239, 68, 68, 0.3)' : '#222'}`,
            borderRadius: '12px',
          }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                GAN Transactions
              </div>
              <div style={{ fontSize: '0.8rem', color: isGanEnabled ? '#10b981' : signerStatus === 'unavailable' ? '#f87171' : '#666' }}>
                {isGanEnabled 
                  ? 'GAN can mint NFTs for you' 
                  : signerStatus === 'unavailable'
                    ? 'Not available (check Privy Dashboard)'
                    : 'Enable to let GAN mint on your behalf'}
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button
              onClick={async () => {
                if (signerStatus === 'unavailable') {
                  setToast({ 
                    message: 'Enable "Delegated Actions" in Privy Dashboard → Authorization', 
                    type: 'warning' 
                  });
                  return;
                }
                if (isGanEnabled) {
                  setToast({ message: 'Disabling coming soon', type: 'warning' });
                } else {
                  setTogglingGan(true);
                  const success = await addGanSigner();
                  setTogglingGan(false);
                  if (success) {
                    setToast({ message: 'GAN agent enabled!', type: 'success' });
                  } else if (signerError) {
                    setToast({ message: signerError, type: 'error' });
                  }
                }
              }}
              disabled={togglingGan || signerStatus === 'checking'}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                padding: '2px',
                cursor: signerStatus === 'unavailable' ? 'help' : togglingGan ? 'wait' : 'pointer',
                background: isGanEnabled ? '#10b981' : signerStatus === 'unavailable' ? '#4b5563' : '#333',
                transition: 'background 0.2s ease',
                position: 'relative',
                opacity: signerStatus === 'unavailable' ? 0.5 : 1,
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                background: '#fff',
                transition: 'transform 0.2s ease',
                transform: isGanEnabled ? 'translateX(24px)' : 'translateX(0)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
          
          {/* Error/Help message */}
          {signerStatus === 'unavailable' && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#f87171'
            }}>
              <strong>Setup Required:</strong> Go to{' '}
              <a 
                href="https://dashboard.privy.io" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#5ce1e6', textDecoration: 'underline' }}
              >
                Privy Dashboard
              </a>
              {' '}→ Wallet infrastructure → Authorization → Enable "Delegated Actions"
            </div>
          )}
        </div>

        {/* Referral System */}
        <div style={{
          background: 'rgba(92, 225, 230, 0.05)',
          border: '1px solid rgba(92, 225, 230, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
              🎁 Referral Program
            </div>
            <div style={{ 
              background: 'rgba(212, 168, 75, 0.2)', 
              padding: '4px 10px', 
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#d4a84b'
            }}>
              {referralStats.points} pts
            </div>
          </div>
          
          <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '16px', lineHeight: 1.5 }}>
            Share your link — every friend who joins Ganland boosts your score!
          </div>
          
          {/* Referral Link */}
          {referralLink && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                flex: 1,
                background: '#0a0a0a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '12px 14px',
                fontFamily: '"Share Tech Mono", monospace',
                fontSize: '0.8rem',
                color: '#5ce1e6',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {referralLink}
              </div>
              <button
                onClick={handleCopyReferral}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(92, 225, 230, 0.2)',
                  color: copied ? '#10b981' : '#5ce1e6',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          )}
          
          {/* Referral Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(92, 225, 230, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{referralStats.referrals}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Friends Joined</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d4a84b' }}>{referralStats.points}</div>
              <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Points</div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: '0.75rem', color: '#555', textAlign: 'center' }}>
          Link accounts to recover access if you lose one method
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 20px',
          borderRadius: '8px',
          background: toast.type === 'success' ? '#10b981' : toast.type === 'warning' ? '#f59e0b' : '#ef4444',
          color: toast.type === 'warning' ? '#000' : '#fff',
          fontSize: '0.9rem',
          fontWeight: 500,
          maxWidth: '90vw',
          textAlign: 'center',
          zIndex: 1001,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
