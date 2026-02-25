'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { useGanWallet } from '../hooks/useGanWallet';

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
  // Use GanWallet context for immediate updates
  const { ready, authenticated, address: walletAddress, wallet, user, isCreating } = useGanWallet();
  
  const [ganBalance, setGanBalance] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]); // Base default
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [copied, setCopied] = useState(false);

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

// Transfer Modal Component - Uses Privy hooks directly for wallet access
function TransferModal({ walletAddress, selectedChain, onClose }) {
  // Get wallet directly from Privy's useWallets hook for signing capability
  const { wallets, ready: walletsReady } = useWallets();
  const { sendTransaction } = usePrivy();
  const privyWallet = wallets?.find(w => w.walletClientType === 'privy');
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [walletStatus, setWalletStatus] = useState('checking');
  const [balance, setBalance] = useState(null);
  const [loadingMax, setLoadingMax] = useState(false);

  // Fetch balance for max calculation
  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch(selectedChain.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [walletAddress, 'latest']
          })
        });
        const data = await res.json();
        if (data.result) {
          setBalance(BigInt(data.result));
        }
      } catch (e) {
        console.error('[Transfer] Failed to fetch balance:', e);
      }
    }
    fetchBalance();
  }, [walletAddress, selectedChain]);

  // Calculate max amount (balance - estimated gas)
  const handleMax = async () => {
    if (!balance || !privyWallet) return;
    
    setLoadingMax(true);
    try {
      // Estimate gas for a basic ETH transfer (21000 gas)
      const gasLimit = 21000n;
      
      // Get current gas price
      const res = await fetch(selectedChain.rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_gasPrice',
          params: []
        })
      });
      const data = await res.json();
      const gasPrice = BigInt(data.result || '0x0');
      
      // Add 10% buffer for gas price fluctuation
      const gasCost = (gasLimit * gasPrice * 110n) / 100n;
      
      // Calculate max sendable amount
      const maxAmount = balance > gasCost ? balance - gasCost : 0n;
      
      if (maxAmount > 0n) {
        // Convert to ETH string with proper precision
        const ethAmount = Number(maxAmount) / 1e18;
        setAmount(ethAmount.toFixed(6));
      } else {
        setError('Insufficient balance for gas fees');
      }
    } catch (e) {
      console.error('[Transfer] Failed to calculate max:', e);
      setError('Failed to calculate max amount');
    } finally {
      setLoadingMax(false);
    }
  };

  // Check wallet status on mount and when wallets change
  useEffect(() => {
    if (!walletsReady) {
      setWalletStatus('loading');
      return;
    }
    
    if (privyWallet) {
      console.log('[Transfer] Wallet ready:', privyWallet.address);
      setWalletStatus('ready');
    } else {
      console.log('[Transfer] No Privy wallet found. Available wallets:', wallets?.map(w => w.walletClientType));
      setWalletStatus('not_found');
    }
  }, [walletsReady, privyWallet, wallets]);

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Method 1: Try using Privy's sendTransaction (handles wallet connection automatically)
      if (sendTransaction) {
        console.log('[Transfer] Using Privy sendTransaction...');
        
        // Switch chain first if needed
        if (privyWallet) {
          try {
            console.log('[Transfer] Switching to chain:', selectedChain.id);
            await privyWallet.switchChain(selectedChain.id);
          } catch (chainErr) {
            console.log('[Transfer] Chain switch failed, continuing:', chainErr.message);
          }
        }

        const weiValue = parseEther(amount);
        const txRequest = {
          to: recipient,
          value: '0x' + weiValue.toString(16), // Hex value with 0x prefix
          chainId: selectedChain.id,
        };
        
        console.log('[Transfer] Sending via Privy:', txRequest);
        const receipt = await sendTransaction(txRequest);
        
        console.log('[Transfer] TX hash:', receipt.transactionHash);
        setTxHash(receipt.transactionHash);
        console.log('[Transfer] TX confirmed!');
        return;
      }

      // Method 2: Fallback to direct wallet signing
      if (!privyWallet) {
        setError('Wallet not ready for signing. Please try refreshing the page.');
        return;
      }

      console.log('[Transfer] Switching to chain:', selectedChain.id);
      await privyWallet.switchChain(selectedChain.id);
      
      console.log('[Transfer] Getting provider...');
      const provider = await privyWallet.getEthersProvider();
      const signer = provider.getSigner();

      console.log('[Transfer] Sending transaction...');
      const tx = await signer.sendTransaction({
        to: recipient,
        value: parseEther(amount)
      });

      console.log('[Transfer] TX hash:', tx.hash);
      setTxHash(tx.hash);
      await tx.wait();
      console.log('[Transfer] TX confirmed!');
    } catch (e) {
      console.error('[Transfer] Failed:', e);
      // Provide more helpful error messages
      let errorMsg = e.message || 'Transfer failed';
      if (errorMsg.includes('User exited') || errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction was cancelled';
      } else if (errorMsg.includes('insufficient funds')) {
        errorMsg = 'Insufficient funds for transfer + gas';
      } else if (errorMsg.includes('connector')) {
        errorMsg = 'Wallet connection issue. Try logging out and back in.';
      }
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  // Get block explorer URL for the selected chain
  const getExplorerUrl = (hash) => {
    const explorers = {
      8453: 'https://basescan.org',
      10: 'https://optimistic.etherscan.io',
      1: 'https://etherscan.io',
      360: 'https://shapescan.xyz',
      1868: 'https://soneium.blockscout.com',
      130: 'https://uniscan.xyz',
      5330: 'https://explorer.superseed.xyz',
    };
    return `${explorers[selectedChain.id] || 'https://basescan.org'}/tx/${hash}`;
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
              href={getExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
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
            {/* Wallet Status Warning */}
            {walletStatus === 'loading' && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2">
                <span className="animate-spin">⏳</span> Loading wallet...
              </div>
            )}
            {walletStatus === 'not_found' && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                ⚠️ Wallet not ready for signing. Try refreshing the page.
              </div>
            )}

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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-400">Amount (ETH)</label>
                <button
                  type="button"
                  onClick={handleMax}
                  disabled={loadingMax || !balance || walletStatus !== 'ready'}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gan-yellow rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMax ? '...' : 'MAX'}
                </button>
              </div>
              <input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:border-gan-yellow outline-none"
              />
              {balance !== null && (
                <div className="text-xs text-gray-500 mt-1">
                  Available: {(Number(balance) / 1e18).toFixed(6)} ETH
                </div>
              )}
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
              disabled={sending || walletStatus !== 'ready'}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-colors ${
                sending || walletStatus !== 'ready'
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                  : 'bg-gan-yellow text-black hover:bg-gan-gold'
              }`}
            >
              {sending ? 'Sending...' : walletStatus !== 'ready' ? 'Wallet Not Ready' : 'Send ETH'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
