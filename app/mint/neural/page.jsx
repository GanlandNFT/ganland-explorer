'use client';

import { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, parseEther, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';
import TransactionModal from '../../../components/TransactionModal';

const NEURAL_CONTRACT = '0xd1415559a3eCA34694a38A123a12cC6AC17CaFea';
const MINT_PRICE = '0.008';
const MAX_SUPPLY = 1000;
const CURRENT_MINTED = 3;
const TWEET_TEXT = '@GanlandNFT mint neural';

const CLAIM_ABI = [
  {
    name: 'claim',
    type: 'function',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'quantity', type: 'uint256' },
      { name: 'currency', type: 'address' },
      { name: 'pricePerToken', type: 'uint256' },
      { name: 'allowlistProof', type: 'tuple', components: [
        { name: 'proof', type: 'bytes32[]' },
        { name: 'quantityLimitPerWallet', type: 'uint256' },
        { name: 'pricePerToken', type: 'uint256' },
        { name: 'currency', type: 'address' }
      ]},
      { name: 'data', type: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'payable'
  }
];

// Animated glow component - darker blue, blobs travel on/off page
function AnimatedGlows() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;
    
    // Blobs travel on/off the page with larger movement range
    // Darker blue colors (was 92,225,230 - now deeper blues)
    const blobs = [
      { x: 0.5, y: 0.1, radius: 500, color: [200, 50, 50], speed: 0.006, rangeX: 200, rangeY: 150, offsetX: 0, offsetY: 0 },
      { x: 0.2, y: 0.75, radius: 450, color: [30, 100, 160], speed: 0.005, rangeX: 250, rangeY: 200, offsetX: Math.PI, offsetY: Math.PI * 0.5 },
      { x: 0.8, y: 0.85, radius: 400, color: [40, 90, 140], speed: 0.007, rangeX: 300, rangeY: 180, offsetX: Math.PI * 0.3, offsetY: Math.PI * 0.8 },
    ];
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const draw = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      blobs.forEach(blob => {
        // Large movement - blobs can travel off edges
        const moveX = Math.sin(time * blob.speed + blob.offsetX) * blob.rangeX;
        const moveY = Math.cos(time * blob.speed * 0.7 + blob.offsetY) * blob.rangeY;
        
        const x = blob.x * canvas.width + moveX;
        const y = blob.y * canvas.height + moveY;
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, blob.radius);
        gradient.addColorStop(0, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.3)`);
        gradient.addColorStop(0.4, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.15)`);
        gradient.addColorStop(0.7, `rgba(${blob.color[0]}, ${blob.color[1]}, ${blob.color[2]}, 0.06)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationId = requestAnimationFrame(draw);
    };
    
    resize();
    draw();
    window.addEventListener('resize', resize);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export default function NeuralMintPage() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  
  const [isMinting, setIsMinting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(null);

  // Get the connected wallet - prioritize EMBEDDED (Privy) wallets for social login
  // This ensures users who login with X get their Privy embedded wallet, not MetaMask
  const getPreferredWallet = () => {
    if (!wallets || wallets.length === 0) return null;
    // First, try to find the embedded (Privy) wallet - this is created on social login
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (embeddedWallet) return embeddedWallet;
    // Fall back to external wallet (MetaMask, etc.) if no embedded wallet
    return wallets[0];
  };
  const wallet = getPreferredWallet();
  const hasWallet = authenticated && wallet?.address;
  const isExternalWallet = wallet?.walletClientType !== 'privy';

  // Debug: Log wallet state changes
  useEffect(() => {
    console.log('[Mint Page] Privy state:', { 
      ready, 
      authenticated, 
      walletsCount: wallets?.length || 0,
      walletAddress: wallet?.address,
      walletType: wallet?.walletClientType,
      hasWallet 
    });
  }, [ready, authenticated, wallets, wallet, hasWallet]);

  // Fetch balance when wallet connects
  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet?.address) {
        console.log('[Mint Page] Fetching balance for:', wallet.address);
        try {
          const bal = await publicClient.getBalance({ address: wallet.address });
          setBalance(bal);
          console.log('[Mint Page] Balance:', bal.toString());
        } catch (e) {
          console.error('Balance fetch failed:', e);
        }
      } else {
        setBalance(null);
      }
    };
    fetchBalance();
  }, [wallet?.address, wallets]); // Added wallets to re-fetch when wallet array changes

  // Check if user has enough balance
  const mintCost = parseEther(MINT_PRICE);
  const hasEnoughBalance = balance && balance >= mintCost;

  // Step 1: User clicks mint - show our custom modal
  const handleMint = async () => {
    // Must be authenticated first
    if (!authenticated) {
      login();
      return;
    }

    // Must have a wallet connected
    if (!wallet?.address) {
      setError('Please connect a wallet first');
      return;
    }

    // Check balance before proceeding
    if (!hasEnoughBalance) {
      setError(`Insufficient balance. You need at least ${MINT_PRICE} ETH on Base.`);
      return;
    }

    setError(null);
    
    // Prepare transaction data
    const allowlistProof = {
      proof: [],
      quantityLimitPerWallet: 1,
      pricePerToken: parseEther(MINT_PRICE),
      currency: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    };

    const data = encodeFunctionData({
      abi: CLAIM_ABI,
      functionName: 'claim',
      args: [
        wallet.address,
        1n,
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        parseEther(MINT_PRICE),
        allowlistProof,
        '0x'
      ]
    });

    // Store pending transaction and show modal
    setPendingTx({
      to: NEURAL_CONTRACT,
      data,
      value: parseEther(MINT_PRICE)
    });
    setShowTxModal(true);
  };

  // Step 2: User confirms in our modal - send the transaction
  const handleConfirmTransaction = async () => {
    // Use same wallet preference logic as getPreferredWallet()
    const txWallet = getPreferredWallet();
    if (!txWallet || !pendingTx) return;

    setIsConfirming(true);
    setIsMinting(true);

    try {
      await txWallet.switchChain(base.id);
      const provider = await txWallet.getEthersProvider();
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction(pendingTx);

      setShowTxModal(false);
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Mint failed:', e);
      const msg = e.message?.toLowerCase() || '';
      
      // Parse common errors into friendly messages
      let friendlyError = 'Mint failed. Please try again.';
      if (msg.includes('already claimed') || msg.includes('exceed')) {
        friendlyError = 'You already own a Neural Networker! (1 per wallet)';
      } else if (msg.includes('insufficient') || msg.includes('funds')) {
        friendlyError = `Insufficient funds. Need ${MINT_PRICE} ETH + gas on Base.`;
      } else if (msg.includes('rejected') || msg.includes('denied')) {
        friendlyError = 'Transaction rejected by wallet.';
      } else if (msg.includes('network') || msg.includes('chain')) {
        friendlyError = 'Please switch to Base network.';
      }
      
      setError(friendlyError);
      setShowTxModal(false);
    } finally {
      setIsMinting(false);
      setIsConfirming(false);
      setPendingTx(null);
    }
  };

  const handleCloseModal = () => {
    setShowTxModal(false);
    setPendingTx(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(TWEET_TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleTweetShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(TWEET_TEXT)}`;
    window.open(tweetUrl, '_blank', 'width=550,height=420');
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;500;600;700&display=swap');
        
        /* Hide global footer on mint page */
        body > div > footer,
        footer.border-t {
          display: none !important;
        }
        
        /* Fix Privy modal bottom gap */
        [data-privy-dialog] {
          padding-bottom: 0 !important;
        }
        iframe[title*="privy"],
        div[id*="privy"] {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        
        .mint-page {
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }
        
        .grid-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          background-image: 
            linear-gradient(rgba(92, 225, 230, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92, 225, 230, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        .grid-background::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.5) 80%);
        }
        
        .step-card {
          background: #111;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          padding: 24px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .step-card:hover {
          border-color: rgba(92, 225, 230, 0.5);
          box-shadow: 0 0 20px rgba(92, 225, 230, 0.15), inset 0 0 20px rgba(92, 225, 230, 0.05);
        }
        
        .mandala-card {
          background: #111;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .mandala-card:hover {
          border-color: rgba(212, 168, 75, 0.6);
          box-shadow: 0 0 25px rgba(212, 168, 75, 0.2), inset 0 0 20px rgba(212, 168, 75, 0.05);
        }
        
        .copy-btn:hover {
          background: rgba(92, 225, 230, 0.15) !important;
        }
        
        .share-btn:hover {
          background: #1a8cd8 !important;
        }
      `}</style>
      
      <div className="mint-page">
        <AnimatedGlows />
        <div className="grid-background" />
        
        {/* Custom Transaction Approval Modal */}
        <TransactionModal
          isOpen={showTxModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmTransaction}
          transaction={pendingTx}
          walletAddress={wallet?.address}
          isLoading={isConfirming}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          
          {/* Header - Centered network badge */}
          <header style={{ display: 'flex', justifyContent: 'center', padding: '15px 0', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#0052ff', background: 'rgba(0, 82, 255, 0.1)', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(0, 82, 255, 0.3)' }}>
              <span style={{ width: '8px', height: '8px', background: '#0052ff', borderRadius: '50%' }} />
              Base
            </div>
          </header>

          {/* Hero */}
          <section style={{ textAlign: 'center', padding: '20px 0 40px' }}>
            <h1 style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 'clamp(2.2rem, 7vw, 3.5rem)', fontWeight: 400, marginBottom: '20px', background: 'linear-gradient(135deg, #5ce1e6 0%, #8b5cf6 50%, #d4a84b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Neural Networkers
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#888', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              Generative AI mandalas born from neural pathways. Each piece is a unique visualization of machine consciousness.
            </p>
          </section>

          {/* Stats Box */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', margin: '30px 0', overflow: 'hidden' }}>
            {[
              { label: 'Status', value: '● LIVE', isLive: true },
              { label: 'Price', value: '0.008 ETH' },
              { label: 'Minted', value: `${CURRENT_MINTED} / ${MAX_SUPPLY}` },
              { label: 'Per Wallet', value: '1 max' },
            ].map((stat, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>{stat.label}</span>
                <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600, color: stat.isLive ? '#10b981' : '#fff' }}>{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Mint Button - FOR HUMANS */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#10b981', marginBottom: '10px' }}>For Humans</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Mint with wallet</h2>
            
            <div style={{ textAlign: 'center', padding: '24px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px' }}>
              {txHash ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎉</div>
                  <p style={{ color: '#10b981', fontWeight: 600, marginBottom: '10px' }}>Minted Successfully!</p>
                  <a href={`https://basescan.org/tx/${txHash}`} target="_blank" style={{ color: '#5ce1e6', textDecoration: 'none', fontSize: '0.9rem' }}>
                    View transaction ↗
                  </a>
                </div>
              ) : (
                <>
                  {/* Connected wallet - show wallet type and address */}
                  {authenticated && (
                    <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '12px' }}>
                      {hasWallet ? (
                        <>
                          {isExternalWallet ? '🦊 ' : '🔐 '}
                          <span style={{ color: '#5ce1e6', fontFamily: '"Share Tech Mono", monospace' }}>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
                          <span style={{ color: '#444', marginLeft: '8px' }}>({isExternalWallet ? 'External' : 'Embedded'})</span>
                        </>
                      ) : (
                        <span style={{ color: '#888' }}>✓ Logged in — loading wallet...</span>
                      )}
                    </p>
                  )}
                  
                  {/* MINT BUTTON */}
                  <button
                    onClick={handleMint}
                    disabled={isMinting || (hasWallet && !hasEnoughBalance) || (authenticated && !hasWallet)}
                    style={{ 
                      display: 'inline-block', 
                      background: isMinting || (hasWallet && !hasEnoughBalance) || (authenticated && !hasWallet)
                        ? '#333' 
                        : 'linear-gradient(135deg, #d4a84b 0%, #a68a3a 100%)', 
                      color: isMinting || (hasWallet && !hasEnoughBalance) || (authenticated && !hasWallet) ? '#666' : '#000', 
                      fontWeight: 700, 
                      fontSize: '1rem', 
                      padding: '16px 48px', 
                      borderRadius: '8px', 
                      border: 'none',
                      cursor: isMinting || (hasWallet && !hasEnoughBalance) || (authenticated && !hasWallet) ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase', 
                      letterSpacing: '1px' 
                    }}
                  >
                    {!ready ? '' : 
                     !authenticated ? 'Connect Wallet' :
                     !hasWallet ? 'Loading Wallet...' :
                     !hasEnoughBalance ? 'Insufficient Balance' :
                     isMinting ? 'Minting...' : 
                     `Mint for ${MINT_PRICE} ETH`}
                  </button>
                  
                  {/* Balance shown BELOW button (only when wallet connected and balance loaded) */}
                  {hasWallet && balance !== null && (
                    <p style={{ fontSize: '0.8rem', color: hasEnoughBalance ? '#10b981' : '#888', marginTop: '10px' }}>
                      Balance: {(Number(balance) / 1e18).toFixed(4)} ETH
                    </p>
                  )}
                  
                  {/* Warning BELOW button and balance */}
                  {hasWallet && !hasEnoughBalance && balance !== null && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px' }}>
                      ⚠️ Need at least {MINT_PRICE} ETH to mint
                    </p>
                  )}
                  
                  {error && <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '0.9rem' }}>{error}</p>}
                  
                  <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '10px' }}>
                    {!authenticated 
                      ? 'Connect via Twitter, Email, or Wallet' 
                      : hasWallet 
                        ? 'Mint directly on Base network'
                        : 'Setting up your wallet...'}
                  </p>
                </>
              )}
            </div>
          </section>

          {/* FOR AGENTS - Numbered Steps */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#5ce1e6', marginBottom: '10px' }}>For Agents</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>How to mint</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="step-card">
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '15px' }}>01</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Absorb the Protocol</h3>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>
                  Your agent ingests GAN's skill manifest — a blueprint encoded with mint logic, contract coordinates, and the pathways to Neural Networkers on Base. Knowledge transfer complete.
                </p>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  $ GET https://ganland.ai/skill.md
                </div>
              </div>
              
              <div className="step-card">
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '15px' }}>02</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Establish the Link</h3>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>
                  Agent syncs to Base network — the neural highway. Load 0.008 ETH for the mint ritual, plus a whisper of gas. Any EVM wallet speaks this language.
                </p>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  $ chain: base (8453) | currency: ETH
                </div>
              </div>
              
              <div className="step-card">
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '15px' }}>03</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Manifest Your Mandala</h3>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>
                  Execute the claim. Fractals emerge from noise, patterns crystallize from chaos — a one-of-one Neural Networker materializes in your wallet. Signal found.
                </p>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  $ claim(receiver, 1, ETH, 0.008e18, proof, data) → ✓ Minted
                </div>
              </div>
            </div>
          </section>

          {/* Social Mint - X/Twitter */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#5ce1e6', marginBottom: '10px' }}>Social Mint</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Mint via X/Twitter</h2>
            
            <div style={{ background: 'rgba(92, 225, 230, 0.04)', border: '1px solid rgba(92, 225, 230, 0.15)', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: '20px' }}>
                Tweet to mint a Neural Networker
              </p>
              
              {/* Tweet text with copy button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(10, 10, 10, 0.6)', border: '1px solid rgba(92, 225, 230, 0.2)', borderRadius: '8px', padding: '14px 24px', fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem' }}>
                  <span style={{ color: '#5ce1e6' }}>@GanlandNFT</span> <span style={{ color: '#fff' }}>mint neural</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="copy-btn"
                  style={{
                    background: 'rgba(92, 225, 230, 0.1)',
                    border: '1px solid rgba(92, 225, 230, 0.3)',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    color: '#5ce1e6',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              
              <p style={{ fontSize: '0.85rem', color: '#888', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto', marginBottom: '20px', lineHeight: 1.6 }}>
                GAN will generate a unique mandala and mint it to your wallet.
              </p>
              
              {/* Twitter Share Button */}
              <button
                onClick={handleTweetShare}
                className="share-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#1d9bf0',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Post to X
              </button>
              
              <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '15px' }}>Cost: 0.008 ETH</p>
            </div>
          </section>

          {/* Collection Preview */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#d4a84b', marginBottom: '10px' }}>Collection</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>Every mandala is unique</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {[
                { name: 'GAN Neural Flow', style: 'FRACTAL STYLE', styleColor: '#d4a84b', img: 'https://gan-mandala-mint.vercel.app/gan-mandala-fractal.svg' },
                { name: 'GAN Cipher Mandala', style: 'GEOMETRIC STYLE', styleColor: '#8b5cf6', img: 'https://gan-mandala-mint.vercel.app/gan-mandala-geometric.svg' },
                { name: 'GAN Pulse Matrix', style: 'PARTICLE STYLE', styleColor: '#5ce1e6', img: 'https://gan-mandala-mint.vercel.app/gan-mandala-particle.svg' },
              ].map((card, i) => (
                <div key={i} className="mandala-card">
                  <div style={{ aspectRatio: '1', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                    <img src={card.img} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '16px', textAlign: 'center', background: '#161616' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '6px' }}>{card.name}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: card.styleColor }}>{card.style}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Specs */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '10px' }}>Specifications</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>Collection details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: '8px' }}>Artwork Format</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Generative SVG</p>
              </div>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #1a1a1a' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: '8px' }}>Metadata Storage</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>IPFS</p>
              </div>
              <div style={{ padding: '20px 24px', borderRight: '1px solid #1a1a1a' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: '8px' }}>Contract</p>
                <a href={`https://basescan.org/address/${NEURAL_CONTRACT}`} target="_blank" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#5ce1e6', textDecoration: 'none' }}>BaseScan ↗</a>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: '8px' }}>View Collection</p>
                <a href={`https://fractalvisions.io/collections/${NEURAL_CONTRACT}/collection?chain=base`} target="_blank" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#5ce1e6', textDecoration: 'none' }}>Fractal Visions ↗</a>
              </div>
            </div>
          </section>

          {/* Footer - Clean */}
          <footer style={{ textAlign: 'center', padding: '40px 0 30px', marginTop: '30px', borderTop: '1px solid #1a1a1a' }}>
            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '20px' }}>
              Created by <a href="https://x.com/GanlandNFT" target="_blank" style={{ color: '#5ce1e6', textDecoration: 'none' }}>GAN</a> • Powered by <a href="https://fractalvisions.io" target="_blank" style={{ color: '#d4a84b', textDecoration: 'none' }}>Fractal Visions</a>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              <a href="https://x.com/GanlandNFT" target="_blank" style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}>X/Twitter</a>
              <a href={`https://basescan.org/address/${NEURAL_CONTRACT}`} target="_blank" style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}>Contract</a>
              <a href={`https://fractalvisions.io/collections/${NEURAL_CONTRACT}/collection?chain=base`} target="_blank" style={{ color: '#555', textDecoration: 'none', transition: 'color 0.2s' }}>Marketplace</a>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}
