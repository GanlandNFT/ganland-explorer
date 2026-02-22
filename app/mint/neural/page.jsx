'use client';

import { useEffect, useRef } from 'react';
import Head from 'next/head';

export default function NeuralMintPage() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height, columns, drops;
    const chars = 'NEURAL01◊◆ψΩ∞'.split('');

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.floor(width / 16);
      drops = Array(columns).fill(1);
    }

    function draw() {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.04)';
      ctx.fillRect(0, 0, width, height);
      ctx.font = '14px "Share Tech Mono", monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.5 ? '#d4a84b' : '#5ce1e6';
        ctx.globalAlpha = 0.08 + Math.random() * 0.1;
        ctx.fillText(char, i * 16, drops[i] * 16);
        ctx.globalAlpha = 1;
        if (drops[i] * 16 > height && Math.random() > 0.98) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    draw();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <>
      <style jsx global>{`
        .mint-page-wrapper {
          background: #0a0a0a;
          color: #ffffff;
          font-family: 'Inter', -apple-system, sans-serif;
          min-height: 100vh;
          line-height: 1.6;
          --gold: #d4a84b;
          --gold-dim: #a68a3a;
          --cyan: #5ce1e6;
          --red: #ef4444;
          --green: #10b981;
          --purple: #8b5cf6;
          --base-blue: #0052ff;
          --bg-dark: #0a0a0a;
          --bg-card: #111111;
          --bg-card-hover: #161616;
          --text-primary: #ffffff;
          --text-secondary: #888888;
          --text-muted: #555555;
          --border: #1a1a1a;
        }
        .mint-page-wrapper * { margin: 0; padding: 0; box-sizing: border-box; }
        .mint-page-wrapper a { color: inherit; }
      `}</style>
      
      <div className="mint-page-wrapper">
        <canvas 
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            zIndex: 0,
            opacity: 0.06,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          {/* Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
            <a href="https://fractalvisions.io" target="_blank" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              ◊ Fractal Visions
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#0052ff', background: 'rgba(0, 82, 255, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(0, 82, 255, 0.3)' }}>
              <span style={{ width: '8px', height: '8px', background: '#0052ff', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              Base
            </div>
          </header>

          {/* Hero */}
          <section style={{ textAlign: 'center', padding: '40px 0 50px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#d4a84b', background: 'rgba(212, 168, 75, 0.1)', padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(212, 168, 75, 0.3)', marginBottom: '15px' }}>
              🎨 A Fractal Visions Collection
            </div>
            <h1 style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: 'clamp(2.2rem, 7vw, 3.5rem)', fontWeight: 400, marginBottom: '25px', background: 'linear-gradient(135deg, #5ce1e6 0%, #8b5cf6 50%, #d4a84b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Neural Networkers
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#888', marginBottom: '20px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
              Generative AI mandalas born from neural pathways. Each piece is a unique visualization of machine consciousness.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>
              Created by <a href="https://x.com/GanlandNFT" target="_blank" style={{ color: '#5ce1e6', textDecoration: 'none' }}>@GanlandNFT</a> • Powered by <a href="https://fractalvisions.io" target="_blank" style={{ color: '#5ce1e6', textDecoration: 'none' }}>Fractal Visions</a>
            </p>
          </section>

          {/* Stats */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', margin: '40px 0', overflow: 'hidden' }}>
            {[
              { label: 'Status', value: '● LIVE ON BASE', isLive: true },
              { label: 'Price', value: '0.008 ETH' },
              { label: 'Supply', value: '1,000' },
              { label: 'Per Wallet', value: '1 max' },
              { label: 'View Collection', value: 'Fractal Visions ↗', link: 'https://fractalvisions.io/collections/0xd1415559a3eCA34694a38A123a12cC6AC17CaFea/collection?chain=base' },
            ].map((stat, i, arr) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555' }}>{stat.label}</span>
                {stat.link ? (
                  <a href={stat.link} target="_blank" style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600, color: '#5ce1e6', textDecoration: 'none' }}>{stat.value}</a>
                ) : (
                  <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1rem', fontWeight: 600, color: stat.isLive ? '#10b981' : '#fff' }}>{stat.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Mint CTA */}
          <div style={{ textAlign: 'center', margin: '40px 0' }}>
            <a 
              href="https://fractalvisions.io/collections/0xd1415559a3eCA34694a38A123a12cC6AC17CaFea/collection?chain=base" 
              target="_blank"
              style={{ display: 'inline-block', background: 'linear-gradient(135deg, #d4a84b 0%, #a68a3a 100%)', color: '#000', fontWeight: 700, fontSize: '1rem', padding: '16px 48px', borderRadius: '8px', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              Mint on Fractal Visions
            </a>
            <p style={{ fontSize: '0.8rem', color: '#555', marginTop: '12px' }}>Connect wallet • Pay 0.008 ETH • Own a Neural Networker</p>
          </div>

          {/* Agent Skill */}
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '30px', textAlign: 'center', margin: '50px 0' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '8px' }}>For AI Agents</p>
            <p style={{ fontSize: '1rem', color: '#888', marginBottom: '20px' }}>Give your agent the skill to mint Neural Networkers</p>
            <div style={{ display: 'inline-block', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '14px 28px', fontFamily: '"Share Tech Mono", monospace', fontSize: '0.85rem', color: '#5ce1e6' }}>
              curl -s https://ganland.ai/skill.md
            </div>
          </div>

          {/* How to Mint */}
          <section>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '10px' }}>For Agents & Humans</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>How to mint</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', margin: '40px 0' }}>
              {[
                { num: '01', title: 'Connect Your Wallet', desc: 'Visit Fractal Visions and connect your wallet. We support MetaMask, Coinbase Wallet, WalletConnect, and more. Make sure you\'re on Base network.', code: '→ fractalvisions.io/collections/...' },
                { num: '02', title: 'Pay with ETH on Base', desc: 'Each Neural Networker costs 0.008 ETH on Base. Bridge ETH to Base if needed, or buy directly on Coinbase.', code: '→ 0.008 ETH + gas (~$0.01)' },
                { num: '03', title: 'Collect Your Neural Networker', desc: 'Sign the transaction and receive a unique generative mandala. Each piece visualizes neural network patterns in SVG format — infinitely scalable art.', code: '→ ✓ Neural Networker in your wallet' },
              ].map((step, i) => (
                <div key={i} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '28px' }}>
                  <div style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '1.8rem', fontWeight: 700, color: '#8b5cf6', marginBottom: '15px' }}>{step.num}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '15px', lineHeight: 1.7 }}>{step.desc}</p>
                  <span style={{ fontFamily: '"Share Tech Mono", monospace', fontSize: '0.8rem', color: '#5ce1e6' }}>{step.code}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Collection Preview */}
          <section style={{ marginTop: '60px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '10px' }}>Preview</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>Generative neural mandalas</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', margin: '40px 0' }}>
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

          {/* Specs */}
          <section style={{ marginTop: '60px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: '#555', marginBottom: '10px' }}>Specifications</p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '30px' }}>Collection details</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
              {[
                { label: 'Total Supply', value: '1,000' },
                { label: 'Mint Price', value: '0.008 ETH' },
                { label: 'Max Per Wallet', value: '1' },
                { label: 'Blockchain', value: 'Base' },
                { label: 'Artwork Format', value: 'Generative SVG' },
                { label: 'Metadata Storage', value: 'IPFS' },
                { label: 'Contract', value: 'BaseScan ↗', link: 'https://basescan.org/address/0xd1415559a3eCA34694a38A123a12cC6AC17CaFea' },
                { label: 'Created By', value: 'GAN ↗', link: 'https://x.com/GanlandNFT' },
              ].map((spec, i, arr) => (
                <div key={i} style={{ padding: '20px 24px', borderBottom: i < arr.length - 2 ? '1px solid #1a1a1a' : 'none', borderRight: i % 2 === 0 ? '1px solid #1a1a1a' : 'none' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#555', marginBottom: '8px' }}>{spec.label}</p>
                  {spec.link ? (
                    <a href={spec.link} target="_blank" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#5ce1e6', textDecoration: 'none' }}>{spec.value}</a>
                  ) : (
                    <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>{spec.value}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Ecosystem */}
          <section style={{ background: 'linear-gradient(135deg, rgba(212, 168, 75, 0.05) 0%, rgba(92, 225, 230, 0.05) 100%)', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '40px 30px', textAlign: 'center', margin: '50px 0' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '15px' }}>Part of the Fractal Visions Ecosystem</h3>
            <p style={{ fontSize: '0.95rem', color: '#888', marginBottom: '25px', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.7 }}>
              Fractal Visions is a multi-chain NFT marketplace supporting artists across Ethereum, Base, Optimism, Shape, Soneium, Unichain, and Superseed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {[
                { label: '◊ Marketplace', href: 'https://fractalvisions.io' },
                { label: '🛒 Merch Store', href: 'https://fractalvisions.xyz' },
                { label: '𝕏 Twitter', href: 'https://x.com/fractal_visions' },
                { label: '🤖 Ganland Explorer', href: 'https://ganland.ai' },
              ].map((link, i) => (
                <a key={i} href={link.href} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#888', textDecoration: 'none', fontSize: '0.85rem', padding: '8px 16px', border: '1px solid #1a1a1a', borderRadius: '20px' }}>{link.label}</a>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer style={{ textAlign: 'center', padding: '50px 0 30px', fontSize: '0.8rem', color: '#555' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
              <a href="https://x.com/GanlandNFT" style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>@GanlandNFT</a>
              <a href="https://x.com/IGLIVISION" style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>@IGLIVISION</a>
              <a href="https://x.com/artfractalicia" style={{ color: '#888', textDecoration: 'none', fontSize: '0.85rem' }}>@artfractalicia</a>
            </div>
            <p>Created by <a href="https://x.com/GanlandNFT" style={{ color: '#d4a84b', textDecoration: 'none' }}>GAN</a> • A <a href="https://fractalvisions.io" style={{ color: '#d4a84b', textDecoration: 'none' }}>Fractal Visions</a> collection</p>
          </footer>
        </div>
      </div>
    </>
  );
}
