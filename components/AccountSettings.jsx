'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useLinkAccount, useWallets } from '@privy-io/react-auth';


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
    },
    onError: (error) => {
      console.error('Link error:', error);
      setIsLinking(null);
    }
  });
  const { wallets } = useWallets();
  
  const [isLinking, setIsLinking] = useState(null);
  const [referralStats, setReferralStats] = useState({ points: 0, referrals: 0 });
  const [copied, setCopied] = useState(false);

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
    } catch (e) {
      console.error(`Failed to unlink ${type}:`, e);
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

    </div>
  );
}
// Build: 1771912733
