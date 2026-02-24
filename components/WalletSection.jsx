'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { base, optimism, mainnet } from 'viem/chains';
import { useGanSigner } from '../hooks/useGanSigner';

const SUPPORTED_CHAINS = [
  { name: 'Base', color: '#3b82f6', id: 8453, rpc: 'https://base-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU' },
  { name: 'Optimism', color: '#ef4444', id: 10, rpc: 'https://opt-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU' },
  { name: 'Ethereum', color: '#a855f7', id: 1, rpc: 'https://eth-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU' },
  { name: 'Shape', color: '#06b6d4', id: 360, rpc: 'https://mainnet.shape.network' },
  { name: 'Soneium', color: '#ec4899', id: 1868, rpc: 'https://rpc.soneium.org' },
  { name: 'Unichain', color: '#f97316', id: 130, rpc: 'https://mainnet.unichain.org' },
  { name: 'Superseed', color: '#22c55e', id: 5330, rpc: 'https://mainnet.superseed.xyz' },
];

const GAN_TOKEN = '0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07';

export default function WalletSection() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { isGanEnabled, status: signerStatus, addGanSigner } = useGanSigner();
  const [ganBalance, setGanBalance] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]); // Base default
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const walletAddress = user?.wallet?.address;

  useEffect(() => {
    if (walletAddress) {
      fetchGanBalance(walletAddress);
      fetchEthBalance(walletAddress, selectedChain);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress && selectedChain) {
      fetchEthBalance(walletAddress, selectedChain);
    }
  }, [selectedChain]);

  async function fetchGanBalance(address) {
    try {
      const res = await fetch(SUPPORTED_CHAINS[0].rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: GAN_TOKEN,
            data: `0x70a08231000000000000000000000000${address.slice(2)}`
          }, 'latest']
        })
      });
      const data = await res.json();
      if (data.result && data.result !== '0x') {
        const ganWei = BigInt(data.result);
        const ganAmount = Number(ganWei) / 1e18;
        setGanBalance(ganAmount > 1000000 ? `${(ganAmount / 1000000).toFixed(2)}M` : ganAmount.toLocaleString());
      } else {
        setGanBalance('0');
      }
    } catch (err) {
      console.error('Failed to fetch $GAN balance:', err);
      setGanBalance('0');
    }
  }

  async function fetchEthBalance(address, chain) {
    setLoading(true);
    try {
      const res = await fetch(chain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });
      const data = await res.json();
      if (data.result) {
        const ethWei = BigInt(data.result);
        setEthBalance((Number(ethWei) / 1e18).toFixed(4));
      } else {
        setEthBalance('0');
      }
    } catch (err) {
      console.error(`Failed to fetch ETH balance on ${chain.name}:`, err);
      setEthBalance('0');
    } finally {
      setLoading(false);
    }
  }

  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show connected state with balances
  if (ready && authenticated && walletAddress) {
    const xUsername = user?.twitter?.username;
    
    return (
      <>
        <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
          <div className="text-center mb-6">
            {xUsername ? (
              <a
                href={`https://x.com/${xUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-2xl font-bold text-gan-yellow hover:text-gan-gold transition-colors mb-2"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @{xUsername}
              </a>
            ) : (
              <h3 className="text-2xl font-bold mb-2 text-gan-yellow">Connected</h3>
            )}
            
            {/* Address with copy button */}
            <div className="flex items-center justify-center gap-2">
              <p className="text-gray-400 text-sm font-mono">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </p>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <span className="text-green-400 text-xs">✓</span>
                ) : (
                  <svg className="w-4 h-4 text-gray-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">$GAN Balance</div>
              <div className="text-2xl font-bold text-gan-yellow font-mono">
                {ganBalance || '0'}
              </div>
              <div className="text-xs text-gray-600 mt-1">on Base</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
              <div className="text-xs text-gray-500 mb-1">ETH Balance</div>
              <div className="text-2xl font-bold font-mono" style={{ color: selectedChain.color }}>
                {loading ? '...' : ethBalance || '0'}
              </div>
              <div className="text-xs text-gray-600 mt-1">on {selectedChain.name}</div>
            </div>
          </div>

          {/* GAN Agent Status */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm text-gray-400">GAN Agent</span>
              </div>
              {isGanEnabled ? (
                <span className="flex items-center gap-1 text-sm text-green-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Enabled
                </span>
              ) : signerStatus === 'needs_consent' ? (
                <button
                  onClick={addGanSigner}
                  className="text-sm text-gan-yellow hover:text-gan-gold transition-colors font-medium"
                >
                  Enable →
                </button>
              ) : (
                <span className="text-sm text-gray-500">
                  {signerStatus === 'checking' ? 'Checking...' : 'Pending'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isGanEnabled 
                ? 'GAN can mint NFTs and execute transactions on your behalf'
                : 'Enable GAN to mint NFTs and manage transactions for you'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center mb-6">
            <a
              href={`https://app.uniswap.org/swap?chain=base&outputCurrency=${GAN_TOKEN}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors"
            >
              Buy $GAN
            </a>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gan-yellow hover:text-gan-yellow transition-colors"
            >
              Transfer
            </button>
          </div>

          {/* Chain Selection */}
          <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-gray-800">
            {SUPPORTED_CHAINS.map((chain) => {
              const isSelected = selectedChain.id === chain.id;
              return (
                <button
                  key={chain.name}
                  onClick={() => setSelectedChain(chain)}
                  className="px-3 py-1 text-xs rounded-full transition-all"
                  style={{
                    backgroundColor: isSelected ? `${chain.color}30` : `${chain.color}10`,
                    color: isSelected ? chain.color : `${chain.color}80`,
                    border: `1px solid ${isSelected ? chain.color : `${chain.color}30`}`,
                    opacity: isSelected ? 1 : 0.6,
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  ● {chain.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <TransferModal
            walletAddress={walletAddress}
            selectedChain={selectedChain}
            wallets={wallets}
            onClose={() => setShowTransferModal(false)}
          />
        )}
      </>
    );
  }

  // Not connected state
  return (
    <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
      <div className="flex flex-col items-center justify-center py-8">
        <h3 className="text-2xl font-bold mb-2">
          <span className="text-gan-yellow">$GAN</span>{' '}
          <span className="text-white">Portfolio</span>
        </h3>
        <p className="text-gray-400 text-center mb-6 max-w-md">
          The Generative Art Network management system for Ganland.
        </p>

        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🔐</span>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Use the <span className="text-gan-yellow">Connect Wallet</span> button above to get started
        </p>

        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {SUPPORTED_CHAINS.map((chain) => (
            <span
              key={chain.name}
              className="px-3 py-1 text-xs rounded-full opacity-50"
              style={{
                backgroundColor: `${chain.color}15`,
                color: chain.color,
                border: `1px solid ${chain.color}30`,
              }}
            >
              ● {chain.name}
            </span>
          ))}
        </div>
      </div>

      <div className="text-center border-t border-gray-800 pt-4 mt-4">
        <span className="text-gray-500 text-sm">Powered by Privy</span>
      </div>
    </div>
  );
}

// Transfer Modal Component
function TransferModal({ walletAddress, selectedChain, wallets, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address');
      return;
    }

    const wallet = wallets?.[0];
    if (!wallet) {
      setError('No wallet connected');
      return;
    }

    setSending(true);
    setError(null);

    try {
      await wallet.switchChain(selectedChain.id);
      const provider = await wallet.getEthersProvider();
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: recipient,
        value: parseEther(amount)
      });

      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Transfer failed:', e);
      setError(e.message || 'Transfer failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Transfer ETH</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">&times;</button>
        </div>

        {txHash ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <p className="text-green-400 font-bold mb-2">Transfer Successful!</p>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              className="text-blue-400 text-sm hover:underline"
            >
              View transaction ↗
            </a>
            <button
              onClick={onClose}
              className="mt-6 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">From</label>
              <div className="p-3 bg-gray-800/50 rounded-lg font-mono text-sm text-gray-400">
                {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">To Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:border-gan-yellow outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount (ETH)</label>
              <input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:border-gan-yellow outline-none"
              />
            </div>

            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Network</span>
                <span style={{ color: selectedChain.color }}>{selectedChain.name}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleTransfer}
              disabled={sending}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-colors ${
                sending 
                  ? 'bg-gray-700 text-gray-400 cursor-wait' 
                  : 'bg-gan-yellow text-black hover:bg-gan-gold'
              }`}
            >
              {sending ? 'Sending...' : 'Send ETH'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
