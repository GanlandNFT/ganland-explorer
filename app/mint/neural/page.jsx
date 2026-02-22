'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, parseEther, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

const NEURAL_CONTRACT = '0xd1415559a3eCA34694a38A123a12cC6AC17CaFea';
const MINT_PRICE = '0.008';
const MAX_SUPPLY = 1000;
const CURRENT_MINTED = 3;

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

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export default function NeuralMintPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const handleMint = async () => {
    if (!authenticated) {
      login();
      return;
    }

    const wallet = wallets?.[0];
    if (!wallet) {
      setError('No wallet connected');
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      await wallet.switchChain(base.id);
      const provider = await wallet.getEthersProvider();
      const signer = provider.getSigner();
      
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

      const tx = await signer.sendTransaction({
        to: NEURAL_CONTRACT,
        data,
        value: parseEther(MINT_PRICE)
      });

      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Mint failed:', e);
      setError(e.message?.includes('already claimed') 
        ? 'You already own a Neural Networker!'
        : e.message || 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;500;600;700&display=swap');
        
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
          z-index: 0;
          pointer-events: none;
          background-image: 
            linear-gradient(rgba(92, 225, 230, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92, 225, 230, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        /* Blue/red glow effects */
        .grid-background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 300px;
          background: radial-gradient(ellipse at center top, rgba(239, 68, 68, 0.15) 0%, transparent 60%);
        }
        
        .grid-glow-bottom {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 300px;
          background: radial-gradient(ellipse at center bottom, rgba(92, 225, 230, 0.12) 0%, transparent 60%);
          pointer-events: none;
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
      `}</style>
      
      <div className="mint-page">
        <div className="grid-background" />
        <div className="grid-glow-bottom" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          
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
            
            <div style={{ textAlign: 'center', padding: '30px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px' }}>
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
                  <button
                    onClick={handleMint}
                    disabled={isMinting}
                    style={{ 
                      display: 'inline-block', 
                      background: isMinting ? '#444' : 'linear-gradient(135deg, #d4a84b 0%, #a68a3a 100%)', 
                      color: '#000', 
                      fontWeight: 700, 
                      fontSize: '1rem', 
                      padding: '16px 48px', 
                      borderRadius: '8px', 
                      border: 'none',
                      cursor: isMinting ? 'wait' : 'pointer',
                      textTransform: 'uppercase', 
                      letterSpacing: '1px' 
                    }}
                  >
                    {!ready ? 'Loading...' : 
                     !authenticated ? 'Connect Wallet to Mint' :
                     isMinting ? 'Minting...' : 
                     `Mint for ${MINT_PRICE} ETH`}
                  </button>
                  {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem' }}>{error}</p>}
                  <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '12px' }}>
                    Connect your wallet via Privy and mint directly on Base
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
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Learn the Skill</h3>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>
                  Your agent reads the GAN skill file. This teaches it the mint protocol, contract address, and how to interact with the Neural Networkers collection on Base.
                </p>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  $ GET https://ganland.ai/skill.md
                </div>
              </div>
              
              <div className="step-card">
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '15px' }}>02</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Connect Wallet</h3>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>
                  Agent connects to Base using its wallet. Requires 0.008 ETH for mint + ~0.0005 ETH for gas. Supports any EVM-compatible wallet.
                </p>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  $ chain: base (8453) | currency: ETH
                </div>
              </div>
              
              <div className="step-card">
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#ef4444', marginBottom: '15px' }}>03</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Claim & Collect</h3>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>
                  Agent calls the claim function on the contract. A unique Neural Networker mandala is minted to the wallet.
                </p>
                <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  $ claim(receiver, 1, ETH, 0.008e18, proof, data) → ✓ Minted
                </div>
              </div>
            </div>
          </section>

          {/* FOR BOTH - X/Twitter */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#8b5cf6', marginBottom: '10px' }}>For Agents & Humans</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px' }}>Mint via X/Twitter</h2>
            
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '30px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '20px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Tweet to mint a Neural Networker. GAN will generate your unique mandala and mint it to your wallet.
              </p>
              <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '14px 28px', display: 'inline-block', fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', marginBottom: '15px' }}>
                <span style={{ color: '#1d9bf0' }}>@GanlandNFT</span> <span style={{ color: '#fff' }}>mint neural</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#555' }}>Cost: 0.008 ETH to ganland.eth</p>
              <a 
                href="https://x.com/GanlandNFT" 
                target="_blank"
                style={{ display: 'inline-block', marginTop: '15px', padding: '10px 24px', background: '#1d9bf0', color: '#fff', fontWeight: 600, borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Follow @GanlandNFT
              </a>
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

          {/* Specs - Only non-repetitive items */}
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

        </div>
      </div>
    </>
  );
}
