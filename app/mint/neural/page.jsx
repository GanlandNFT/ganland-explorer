'use client';

import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, parseEther, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

const NEURAL_CONTRACT = '0xd1415559a3eCA34694a38A123a12cC6AC17CaFea';
const MINT_PRICE = '0.008';
const MAX_SUPPLY = 1000;
const CURRENT_MINTED = 3; // Lazy minted so far

// Minimal ERC721 ABI for claim
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
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Handle mint
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
          --gold: #d4a84b;
          --cyan: #5ce1e6;
          --purple: #8b5cf6;
          --green: #10b981;
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
            linear-gradient(rgba(92, 225, 230, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(92, 225, 230, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        
        .grid-background::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, transparent 0%, #0a0a0a 70%);
        }
      `}</style>
      
      <div className="mint-page">
        {/* Grid Background */}
        <div className="grid-background" />

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>Status</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600, color: '#10b981' }}>● LIVE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>Price</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600 }}>0.008 ETH</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>Minted</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600 }}>{CURRENT_MINTED} / {MAX_SUPPLY}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>Per Wallet</span>
              <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600 }}>1 max</span>
            </div>
          </div>

          {/* Mint Button */}
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            {txHash ? (
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🎉</div>
                <p style={{ color: '#10b981', fontWeight: 600, marginBottom: '10px' }}>Minted Successfully!</p>
                <a 
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  style={{ color: '#5ce1e6', textDecoration: 'none', fontSize: '0.9rem' }}
                >
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
                  Connect wallet • Pay 0.008 ETH • Receive your Neural Networker
                </p>
              </>
            )}
          </div>

          {/* How to Mint - 3 Ways */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '10px' }}>For Agents & Humans</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>Three ways to mint</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>👤</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Human: Mint Button</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '12px' }}>
                  Connect your wallet using the button above and mint directly. Requires 0.008 ETH + gas on Base.
                </p>
                <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem', color: '#10b981' }}>→ Click "Connect Wallet to Mint" above</span>
              </div>
              
              <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🤖</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Agent: Use the Skill</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '12px' }}>
                  AI agents can learn to mint by reading the GAN skill file. It contains contract details and mint instructions.
                </p>
                <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
                  curl -s https://ganland.ai/skill.md
                </div>
              </div>
              
              <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>𝕏</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Both: Request on X</h3>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '12px' }}>
                  Humans and agents can request a mint by tweeting to @GanlandNFT. Pay 0.008 ETH to ganland.eth and receive your unique Neural Networker.
                </p>
                <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '12px', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem' }}>
                  <span style={{ color: '#1d9bf0' }}>@GanlandNFT</span> <span style={{ color: '#fff' }}>mint neural</span>
                </div>
              </div>
            </div>
          </section>

          {/* Collection Preview */}
          <section style={{ margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '10px' }}>Preview</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>Generative neural mandalas</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {[
                { name: 'Neural Flow', img: 'https://gan-mandala-mint.vercel.app/gan-mandala-fractal.svg' },
                { name: 'Cipher Mandala', img: 'https://gan-mandala-mint.vercel.app/gan-mandala-geometric.svg' },
                { name: 'Pulse Matrix', img: 'https://gan-mandala-mint.vercel.app/gan-mandala-particle.svg' },
              ].map((card, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <img src={card.img} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 500, color: '#888', background: '#161616' }}>{card.name}</div>
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

          {/* Mint via X Section */}
          <section style={{ background: 'linear-gradient(135deg, rgba(29, 155, 240, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(29, 155, 240, 0.3)', borderRadius: '12px', padding: '30px', textAlign: 'center', margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '8px' }}>For AI Agents & Humans</p>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '15px' }}>Mint via X/Twitter</h3>
            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '20px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Tweet to mint a Neural Networker. GAN will generate your unique mandala.
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
          </section>

        </div>
      </div>
    </>
  );
}
