'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { BrowserProvider } from 'ethers';
import { useGanWallet } from '../hooks/useGanWallet';

const SUPPORTED_CHAINS = [
  { name: 'Base', color: '#3b82f6', id: 8453, rpc: 'https://base-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU', explorer: 'https://basescan.org' },
  { name: 'Optimism', color: '#ef4444', id: 10, rpc: 'https://opt-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU', explorer: 'https://optimistic.etherscan.io' },
  { name: 'Ethereum', color: '#a855f7', id: 1, rpc: 'https://eth-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU', explorer: 'https://etherscan.io' },
  { name: 'Shape', color: '#06b6d4', id: 360, rpc: 'https://mainnet.shape.network', explorer: 'https://shapescan.xyz' },
  { name: 'Soneium', color: '#ec4899', id: 1868, rpc: 'https://rpc.soneium.org', explorer: 'https://soneium.blockscout.com' },
  { name: 'Unichain', color: '#f97316', id: 130, rpc: 'https://mainnet.unichain.org', explorer: 'https://uniscan.xyz' },
  { name: 'Superseed', color: '#22c55e', id: 5330, rpc: 'https://mainnet.superseed.xyz', explorer: 'https://superseed.blockscout.com' },
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
  const [viewMode, setViewMode] = useState('tokens'); // 'tokens' or 'nfts'
  const [nfts, setNfts] = useState([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null); // For transfer/list modal

  useEffect(() => {
    if (walletAddress) {
      fetchGanBalance(walletAddress);
      fetchEthBalance(walletAddress, selectedChain);
    }
  }, [walletAddress]);

  // Fetch NFTs when switching to NFT view or changing chain
  useEffect(() => {
    if (viewMode === 'nfts' && walletAddress) {
      fetchNfts(walletAddress, selectedChain);
    }
  }, [viewMode, walletAddress, selectedChain]);

  async function fetchNfts(address, chain) {
    setLoadingNfts(true);
    setNfts([]); // Clear previous NFTs when chain changes
    
    // Alchemy NFT API endpoints by chain
    const alchemyEndpoints = {
      8453: 'https://base-mainnet.g.alchemy.com/nft/v3/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU',
      10: 'https://opt-mainnet.g.alchemy.com/nft/v3/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU',
      1: 'https://eth-mainnet.g.alchemy.com/nft/v3/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU',
    };
    
    const endpoint = alchemyEndpoints[chain.id];
    
    if (!endpoint) {
      // For chains without Alchemy support, try to fetch from Launchpad contracts
      if (chain.id === 10) {
        // Optimism - check our Launchpad collections
        try {
          const launchpadRes = await fetch(`/api/user-nfts?wallet=${address}&chain=optimism`);
          const launchpadData = await launchpadRes.json();
          if (launchpadData.nfts) {
            setNfts(launchpadData.nfts);
          }
        } catch (e) {
          console.log('Launchpad NFT fetch failed:', e);
        }
      }
      setLoadingNfts(false);
      return;
    }
    
    try {
      const res = await fetch(`${endpoint}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=20`);
      const data = await res.json();
      if (data.ownedNfts) {
        setNfts(data.ownedNfts.map(nft => ({
          id: `${nft.contract.address}-${nft.tokenId}`,
          name: nft.name || nft.title || `#${nft.tokenId}`,
          image: nft.image?.thumbnailUrl || nft.image?.cachedUrl || nft.raw?.metadata?.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') || '/gan-logo.jpg',
          collection: nft.contract.name || 'Unknown',
          tokenId: nft.tokenId,
          contract: nft.contract.address,
          chain: chain.name.toLowerCase()
        })));
      }
    } catch (e) {
      console.error('Failed to fetch NFTs:', e);
      setNfts([]);
    } finally {
      setLoadingNfts(false);
    }
  }

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
            
            {/* Address - clickable to explorer, with copy icon */}
            <div className="flex items-center justify-center gap-1">
              <a
                href={`${selectedChain.explorer}/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 text-sm font-mono hover:text-white transition-colors"
                title={`View on ${selectedChain.name} explorer`}
              >
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </a>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <span className="text-green-400 text-xs">✓</span>
                ) : (
                  <svg className="w-3.5 h-3.5 text-gray-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* NFTs / Tokens Toggle - Bottom of module */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setViewMode(viewMode === 'tokens' ? 'nfts' : 'tokens')}
              className="group relative px-8 py-2.5 rounded-full bg-gray-800/80 border border-cyan-500/30 hover:border-cyan-400/60 transition-all overflow-hidden"
            >
              {/* Electric pulse animation */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse-slide" />
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="absolute inset-[-2px] rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0 animate-pulse-slide" />
              </span>
              
              {/* Content */}
              <span className="relative flex items-center gap-2 text-sm font-medium text-gray-300 group-hover:text-white">
                {viewMode === 'tokens' ? (
                  <>
                    {/* Grid icon for NFTs */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    NFTs
                  </>
                ) : (
                  <>
                    {/* X icon to hide */}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hide NFTs
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* NFT Grid View */}
        {viewMode === 'nfts' && (
          <div className="max-w-4xl mx-auto mt-6">
            {loadingNfts ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading NFTs...</p>
              </div>
            ) : nfts.length === 0 ? (
              <div className="text-center py-8 bg-gray-900/50 rounded-xl border border-gray-800">
                <p className="text-gray-500">No NFTs found on {selectedChain.name}</p>
                <p className="text-gray-600 text-sm mt-2">Mint some from our collections!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfts.map((nft) => (
                  <NftCard 
                    key={nft.id} 
                    nft={nft} 
                    onTransfer={() => setSelectedNft({ ...nft, action: 'transfer' })}
                    onList={() => setSelectedNft({ ...nft, action: 'list' })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transfer Modal */}
        {showTransferModal && (
          <TransferModal
            walletAddress={walletAddress}
            selectedChain={selectedChain}
            wallet={wallet}
            onClose={() => setShowTransferModal(false)}
          />
        )}

        {/* NFT Action Modal */}
        {selectedNft && (
          <NftActionModal
            nft={selectedNft}
            wallet={wallet}
            onClose={() => setSelectedNft(null)}
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

// Transfer Modal Component with Token Selection and MAX
function TransferModal({ walletAddress, selectedChain, wallet, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [balance, setBalance] = useState(null);
  const [ganBalance, setGanBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Fetch balances on mount
  useEffect(() => {
    async function fetchBalances() {
      setLoadingBalance(true);
      try {
        // Fetch ETH balance
        const ethRes = await fetch(selectedChain.rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0', id: 1, method: 'eth_getBalance',
            params: [walletAddress, 'latest']
          })
        });
        const ethData = await ethRes.json();
        if (ethData.result) setBalance(BigInt(ethData.result));

        // Fetch $GAN balance (only on Base)
        if (selectedChain.id === 8453) {
          const ganRes = await fetch(selectedChain.rpc, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0', id: 1, method: 'eth_call',
              params: [{
                to: GAN_TOKEN,
                data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`
              }, 'latest']
            })
          });
          const ganData = await ganRes.json();
          if (ganData.result && ganData.result !== '0x') {
            setGanBalance(BigInt(ganData.result));
          } else {
            setGanBalance(0n);
          }
        }
      } catch (e) {
        console.error('Failed to fetch balances:', e);
      } finally {
        setLoadingBalance(false);
      }
    }
    fetchBalances();
  }, [walletAddress, selectedChain]);

  // Handle MAX button
  const handleMax = async () => {
    if (selectedToken === 'ETH' && balance) {
      // Leave some for gas (estimate ~0.0001 ETH)
      const gasBuffer = 100000000000000n; // 0.0001 ETH
      const maxAmount = balance > gasBuffer ? balance - gasBuffer : 0n;
      setAmount((Number(maxAmount) / 1e18).toFixed(6));
    } else if (selectedToken === 'GAN' && ganBalance) {
      setAmount((Number(ganBalance) / 1e18).toFixed(2));
    }
  };

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }

    if (!wallet) {
      setError('Wallet not ready yet - please wait a moment');
      return;
    }

    setSending(true);
    setError(null);

    // Resolve ENS names, @ handles, or validate address
    let resolvedAddress = recipient.trim();
    
    // Handle @ mentions (Twitter handles)
    if (resolvedAddress.startsWith('@') || (!resolvedAddress.startsWith('0x') && !resolvedAddress.includes('.'))) {
      const handle = resolvedAddress.replace('@', '');
      try {
        const res = await fetch(`/api/lookup-handle?handle=${encodeURIComponent(handle)}`);
        const data = await res.json();
        if (data.address) {
          resolvedAddress = data.address;
          console.log(`Resolved @${handle} → ${resolvedAddress}`);
        } else {
          setError(data.error === 'User not found' 
            ? `@${handle} not found in Ganland` 
            : `Could not resolve @${handle}`);
          setSending(false);
          return;
        }
      } catch (e) {
        setError(`Handle lookup failed: @${handle}`);
        setSending(false);
        return;
      }
    }
    // Handle ENS names
    else if (resolvedAddress.endsWith('.eth')) {
      try {
        const res = await fetch(`https://api.ensideas.com/ens/resolve/${resolvedAddress}`);
        const data = await res.json();
        if (data.address) {
          resolvedAddress = data.address;
          console.log(`Resolved ${recipient} → ${resolvedAddress}`);
        } else {
          setError(`Could not resolve ${recipient}`);
          setSending(false);
          return;
        }
      } catch (e) {
        setError(`ENS lookup failed: ${recipient}`);
        setSending(false);
        return;
      }
    }

    if (!resolvedAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid address, ENS, or @handle');
      setSending(false);
      return;
    }

    // Timeout helper - fast timeout (5s) since Privy errors are usually immediate
    const withTimeout = (promise, ms, errorMsg) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
      ]);
    };

    try {
      await withTimeout(wallet.switchChain(selectedChain.id), 5000, 'Network switch timed out');
      const eip1193Provider = await withTimeout(
        wallet.getEthereumProvider(), 
        5000, 
        '⚠️ Wallet not ready.\n\nTry refreshing the page.'
      );
      const provider = new BrowserProvider(eip1193Provider);
      const signer = await provider.getSigner();

      let tx;
      if (selectedToken === 'ETH') {
        tx = await withTimeout(
          signer.sendTransaction({ to: resolvedAddress, value: parseEther(amount) }),
          10000,
          '⚠️ Transaction timed out.\n\nTry again or refresh the page.'
        );
      } else if (selectedToken === 'GAN') {
        // ERC20 transfer
        const amountWei = parseEther(amount);
        const transferData = `0xa9059cbb000000000000000000000000${resolvedAddress.slice(2)}${amountWei.toString(16).padStart(64, '0')}`;
        tx = await withTimeout(
          signer.sendTransaction({ to: GAN_TOKEN, data: transferData }),
          10000,
          '⚠️ Transaction timed out.\n\nTry again or refresh the page.'
        );
      }

      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      console.error('Transfer failed:', e);
      let errorMsg = e.message || 'Transfer failed';
      
      // Catch various Privy wallet errors - keep messages SHORT
      if (errorMsg.includes('insufficient funds') || errorMsg.includes('exceeds the balance')) {
        errorMsg = '⚠️ Insufficient funds for gas + value';
      } else if (errorMsg.includes('Recovery method') || errorMsg.includes('recovery method')) {
        errorMsg = '⚠️ Wallet signing failed. Try refreshing.';
      } else if (errorMsg.includes('Unknown connector') || errorMsg.includes('connector error')) {
        errorMsg = '⚠️ Wallet connection error. Refresh page.';
      } else if (errorMsg.includes('User exited') || errorMsg.includes('user exited')) {
        errorMsg = '⚠️ Wallet popup closed. Try again.';
      } else if (errorMsg.includes('user rejected') || errorMsg.includes('User rejected')) {
        errorMsg = 'Transaction cancelled';
      } else if (errorMsg.includes('timed out')) {
        errorMsg = '⚠️ Transaction timed out. Try again.';
      } else {
        // Truncate long error messages
        errorMsg = errorMsg.length > 100 ? errorMsg.slice(0, 100) + '...' : errorMsg;
        errorMsg = `⚠️ ${errorMsg}`;
      }
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const currentBalance = selectedToken === 'ETH' 
    ? (balance ? (Number(balance) / 1e18).toFixed(6) : '0')
    : (ganBalance ? (Number(ganBalance) / 1e18).toFixed(2) : '0');

  // Get explorer URL for selected chain
  const getExplorerUrl = (hash) => {
    const explorers = {
      8453: 'https://basescan.org',
      10: 'https://optimistic.etherscan.io',
      1: 'https://etherscan.io',
    };
    return `${explorers[selectedChain.id] || 'https://basescan.org'}/tx/${hash}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-900 pb-2 -mt-2 pt-2">
          <h3 className="text-xl font-bold">Transfer</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">&times;</button>
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
            {/* Token Selector */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Token</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedToken('ETH')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                    selectedToken === 'ETH'
                      ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                      : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  ETH
                </button>
                {selectedChain.id === 8453 && (
                  <button
                    onClick={() => setSelectedToken('GAN')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      selectedToken === 'GAN'
                        ? 'bg-gan-yellow/20 border border-gan-yellow text-gan-yellow'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    $GAN
                  </button>
                )}
              </div>
            </div>

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
                <label className="text-sm text-gray-400">Amount ({selectedToken})</label>
                <button
                  type="button"
                  onClick={handleMax}
                  disabled={loadingBalance}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gan-yellow rounded transition-colors disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
              <input
                type="number"
                step={selectedToken === 'GAN' ? '1' : '0.0001'}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={selectedToken === 'GAN' ? '1000' : '0.01'}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:border-gan-yellow outline-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                Available: {loadingBalance ? '...' : currentBalance} {selectedToken}
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Network</span>
                <span style={{ color: selectedChain.color }}>{selectedChain.name}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm max-h-24 overflow-y-auto break-words">
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
              {sending ? 'Sending...' : `Send ${selectedToken}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// NFT Card Component
function NftCard({ nft, onTransfer, onList }) {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group">
      {/* Image */}
      <div className="aspect-square bg-gray-800 relative overflow-hidden">
        <img
          src={imgError ? '/gan-logo.jpg' : nft.image}
          alt={nft.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-gray-300">
          {nft.chain}
        </div>
      </div>
      
      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-500 truncate">{nft.collection}</p>
        <p className="font-medium text-sm truncate">{nft.name}</p>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onTransfer}
            className="flex-1 px-2 py-1.5 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors"
          >
            Transfer
          </button>
          <button
            onClick={onList}
            className="flex-1 px-2 py-1.5 text-xs bg-gan-yellow/20 text-gan-yellow border border-gan-yellow/30 rounded-lg hover:bg-gan-yellow/30 transition-colors"
          >
            List
          </button>
        </div>
      </div>
    </div>
  );
}

// NFT Action Modal (Transfer / List)
function NftActionModal({ nft, wallet, onClose }) {
  const [recipient, setRecipient] = useState('');
  const [price, setPrice] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const isTransfer = nft.action === 'transfer';

  const handleAction = async () => {
    if (isTransfer && !recipient) {
      setError('Enter recipient address');
      return;
    }
    if (!isTransfer && !price) {
      setError('Enter listing price');
      return;
    }

    setSending(true);
    setError(null);

    try {
      if (isTransfer) {
        // ERC721 transferFrom
        await wallet.switchChain(8453); // Base
        const eip1193Provider = await wallet.getEthereumProvider();
        const provider = new BrowserProvider(eip1193Provider);
        const signer = await provider.getSigner();
        const from = await signer.getAddress();
        
        // safeTransferFrom(from, to, tokenId)
        const data = `0x42842e0e000000000000000000000000${from.slice(2)}000000000000000000000000${recipient.slice(2)}${BigInt(nft.tokenId).toString(16).padStart(64, '0')}`;
        
        const tx = await signer.sendTransaction({
          to: nft.contract,
          data: data
        });
        await tx.wait();
        setSuccess(true);
      } else {
        // Listing - would call Fractal Visions API
        // For now, show coming soon
        setError('Listing on Fractal Visions coming soon!');
        return;
      }
    } catch (e) {
      console.error('NFT action failed:', e);
      let errorMsg = e.message || 'Action failed';
      if (errorMsg.includes('Recovery method') || errorMsg.includes('recovery method') || errorMsg.includes('timed out')) {
        errorMsg = '⚠️ Email not linked!\n\nLink your email in Account Settings to sign transactions.';
      } else if (errorMsg.includes('user rejected')) {
        errorMsg = 'Transaction cancelled';
      }
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{isTransfer ? 'Transfer NFT' : 'List NFT'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">&times;</button>
        </div>

        {/* NFT Preview */}
        <div className="flex gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg">
          <img src={nft.image} alt={nft.name} className="w-16 h-16 rounded-lg object-cover" />
          <div>
            <p className="font-medium">{nft.name}</p>
            <p className="text-xs text-gray-500">{nft.collection}</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-green-400">NFT Transferred!</p>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">Close</button>
          </div>
        ) : (
          <>
            {isTransfer ? (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:border-purple-500 outline-none"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Price (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.05"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:border-gan-yellow outline-none"
                />
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm max-h-24 overflow-y-auto break-words">
                {error}
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={sending}
              className={`w-full px-4 py-3 rounded-lg font-bold transition-colors ${
                sending 
                  ? 'bg-gray-700 text-gray-400 cursor-wait' 
                  : isTransfer 
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-gan-yellow text-black hover:bg-gan-gold'
              }`}
            >
              {sending ? 'Processing...' : isTransfer ? 'Transfer' : 'List on Fractal Visions'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
