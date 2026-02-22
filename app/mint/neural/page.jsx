'use client';

import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, parseEther, encodeFunctionData } from 'viem';
import { base } from 'viem/chains';

const NEURAL_CONTRACT = '0xd1415559a3eCA34694a38A123a12cC6AC17CaFea';
const MINT_PRICE = '0.008';
const MAX_SUPPLY = 1000;
const SKILL_URL = 'https://ganland.ai/skill.md';

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
  },
  {
    name: 'totalMinted',
    type: 'function',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  }
];

const publicClient = createPublicClient({
  chain: base,
  transport: http()
});

export default function NeuralMintPage() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const [minted, setMinted] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  // Fetch minted count
  useEffect(() => {
    async function fetchMinted() {
      try {
        const total = await publicClient.readContract({
          address: NEURAL_CONTRACT,
          abi: CLAIM_ABI,
          functionName: 'totalMinted'
        });
        setMinted(Number(total));
      } catch (e) {
        console.error('Failed to fetch minted:', e);
      }
    }
    fetchMinted();
  }, []);

  // Fetch user balance when authenticated
  useEffect(() => {
    async function fetchUserBalance() {
      if (!authenticated || !wallets?.[0]) return;
      try {
        const balance = await publicClient.readContract({
          address: NEURAL_CONTRACT,
          abi: CLAIM_ABI,
          functionName: 'balanceOf',
          args: [wallets[0].address]
        });
        setUserBalance(Number(balance));
      } catch (e) {
        console.error('Failed to fetch user balance:', e);
      }
    }
    fetchUserBalance();
  }, [authenticated, wallets]);

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
      // Switch to Base if needed
      await wallet.switchChain(base.id);
      
      const provider = await wallet.getEthersProvider();
      const signer = provider.getSigner();
      
      // Prepare claim call
      const allowlistProof = {
        proof: [],
        quantityLimitPerWallet: 1,
        pricePerToken: parseEther(MINT_PRICE),
        currency: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' // ETH
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
      setUserBalance(1);
    } catch (e) {
      console.error('Mint failed:', e);
      setError(e.message?.includes('already claimed') 
        ? 'You already own a Neural Networker!'
        : e.message || 'Mint failed');
    } finally {
      setIsMinting(false);
    }
  };

  const alreadyOwns = userBalance && userBalance > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-full border border-blue-500/30">
            ⚡ Superchain Powered
          </span>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-red-500 via-gan-yellow to-cyan-400 bg-clip-text text-transparent">
              Neural Networkers
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            AI-generated sacred geometry for agents & humans.
            <br />
            <span className="text-white font-medium">1,000 generative mandalas on Base.</span>
          </p>
          <div className="mt-4 text-gray-500">
            Created by <a href="https://x.com/GanlandNFT" className="text-gan-yellow hover:underline">GAN</a> (Generative Art Network)
            <br />
            Powered by <a href="https://fractalvisions.io" className="text-purple-400 hover:underline">Fractal Visions</a>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Status" value="● LIVE" valueClass="text-green-400" />
          <StatCard label="Price" value={`${MINT_PRICE} ETH`} />
          <StatCard label="Supply" value={minted !== null ? `${minted} / ${MAX_SUPPLY}` : '— / 1,000'} />
          <StatCard label="Per Wallet" value="1" />
        </div>

        {/* Mint Section */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 mb-12">
          {txHash ? (
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Minted!</h2>
              <p className="text-gray-400 mb-4">Your Neural Networker has been minted.</p>
              <a 
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                className="text-blue-400 hover:underline"
              >
                View transaction ↗
              </a>
            </div>
          ) : alreadyOwns ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-gan-yellow mb-2">You Own a Neural Networker!</h2>
              <p className="text-gray-400 mb-4">Max 1 per wallet. View your collection on Fractal Visions.</p>
              <a 
                href={`https://fractalvisions.io/collections/${NEURAL_CONTRACT}/collection?chain=base`}
                target="_blank"
                className="inline-block px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                View Collection ↗
              </a>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={handleMint}
                disabled={isMinting}
                className={`
                  px-12 py-4 text-xl font-bold rounded-xl transition-all
                  ${isMinting 
                    ? 'bg-gray-700 text-gray-400 cursor-wait' 
                    : 'bg-gradient-to-r from-red-500 to-gan-yellow text-black hover:shadow-lg hover:shadow-gan-yellow/30'}
                `}
              >
                {!ready ? 'Loading...' : 
                 !authenticated ? 'Connect to Mint' :
                 isMinting ? 'Minting...' : 
                 `Mint for ${MINT_PRICE} ETH`}
              </button>
              {error && (
                <p className="mt-4 text-red-400">{error}</p>
              )}
              <p className="mt-4 text-gray-500 text-sm">
                Requires {MINT_PRICE} ETH + ~0.0005 ETH for gas on Base
              </p>
            </div>
          )}
        </div>

        {/* Agent Section */}
        <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-bold text-purple-400">For AI Agents: Learn to Mint</h2>
          </div>
          <div className="bg-gray-900/80 rounded-lg p-4 font-mono text-sm">
            <span className="text-gray-500">$</span> curl -s {SKILL_URL}
          </div>
          <p className="mt-4 text-gray-400 text-sm">
            Give your agent the skill to mint Neural Networkers programmatically
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-8 text-center">How to mint</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard 
              number="01"
              title="Learn the Skill"
              description="Your agent reads the GAN skill file. This teaches it the mint protocol, contract address, and how to interact with the Neural Networkers collection on Base."
              code="$ GET https://ganland.ai/skill.md"
            />
            <StepCard 
              number="02"
              title="Connect Wallet"
              description="Agent connects to Base using its wallet. Requires 0.008 ETH for mint + ~0.0005 ETH for gas. Supports any EVM-compatible wallet."
              code="$ chain: base (8453) | currency: ETH"
            />
            <StepCard 
              number="03"
              title="Claim & Collect"
              description="Agent calls the claim function on the contract. A unique Neural Networker mandala is minted to the wallet."
              code="$ claim(receiver, 1, ETH, 0.008e18, proof, data) → ✓ Minted"
            />
          </div>
        </section>

        {/* Gallery Preview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Every mandala is unique</h2>
          <div className="grid grid-cols-3 gap-4">
            <GalleryCard name="GAN Neural Flow" style="Fractal Style" />
            <GalleryCard name="GAN Cipher Mandala" style="Geometric Style" />
            <GalleryCard name="GAN Pulse Matrix" style="Particle Style" />
          </div>
        </section>

        {/* Collection Details */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Collection details</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DetailCard label="Supply" value="1,000" />
            <DetailCard label="Mint Price" value="0.008 ETH" />
            <DetailCard label="Max Per Wallet" value="1" />
            <DetailCard label="Artwork" value="Generative SVG" />
            <DetailCard label="Blockchain" value="Base (Superchain)" />
            <DetailCard label="Storage" value="IPFS (Pinata)" />
          </div>
        </section>

        {/* Mint via X */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Mint via X/Twitter</h2>
          <p className="text-gray-400 mb-4">Tweet to mint a Neural Networker</p>
          <div className="bg-gray-800 rounded-lg p-4 font-mono inline-block">
            <span className="text-blue-400">@GanlandNFT</span> <span className="text-white">mint neural</span>
          </div>
          <p className="mt-4 text-gray-500 text-sm">
            GAN will generate a unique mandala and mint it to your wallet. Cost: 0.008 ETH
          </p>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className={`font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function StepCard({ number, title, description, code }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="text-4xl font-bold text-gray-700 mb-2">{number}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <div className="bg-gray-800/50 rounded p-2 font-mono text-xs text-gray-500">
        {code}
      </div>
    </div>
  );
}

function GalleryCard({ name, style }) {
  return (
    <div className="bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-gray-800 rounded-xl aspect-square flex flex-col items-center justify-center p-4">
      <div className="text-4xl mb-2">🔮</div>
      <div className="text-sm font-medium text-center">{name}</div>
      <div className="text-xs text-gray-500">{style}</div>
    </div>
  );
}

function DetailCard({ label, value }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
