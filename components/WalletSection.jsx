'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState, useRef } from 'react';
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
const ALCHEMY_KEY = 'ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU';

// Known collections
const KNOWN_COLLECTIONS = {
  '0xd1415559a3eca34694a38a123a12cc6ac17cafea': {
    name: 'Neural Networkers',
    emoji: '🧠',
    price: '0.008 ETH'
  }
};

export default function WalletSection() {
  // Use GanWallet context for immediate wallet updates
  const { ready, authenticated, address: walletAddress, wallet, user, isCreating } = useGanWallet();
  const { login } = usePrivy();
  
  const [ganBalance, setGanBalance] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]); // Base default
  const [activeTab, setActiveTab] = useState('wallet'); // wallet | nfts | terminal
  const [nfts, setNfts] = useState([]);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState([
    { type: 'system', text: '🤖 GAN Terminal v1.0 - Type "help" for commands' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalRef = useRef(null);

  const twitterHandle = user?.twitter?.username;

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

  useEffect(() => {
    if (walletAddress && activeTab === 'nfts') {
      fetchNFTs(walletAddress);
    }
  }, [walletAddress, activeTab]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // Fetch $GAN balance (always on Base)
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

  // Fetch ETH balance on selected chain
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

  async function fetchNFTs(address) {
    setNftsLoading(true);
    try {
      const url = `https://base-mainnet.g.alchemy.com/nft/v3/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU/getNFTsForOwner?owner=${address}&pageSize=20&withMetadata=true`;
      const res = await fetch(url);
      const data = await res.json();
      
      const processed = (data.ownedNfts || []).map(nft => {
        const contractAddr = nft.contract.address.toLowerCase();
        const known = KNOWN_COLLECTIONS[contractAddr];
        return {
          contract: nft.contract.address,
          tokenId: nft.tokenId,
          name: nft.name || nft.raw?.metadata?.name || `#${nft.tokenId}`,
          collection: nft.contract.name || known?.name || 'Unknown',
          image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.raw?.metadata?.image,
          isKnown: !!known,
          knownInfo: known
        };
      });
      
      setNfts(processed);
    } catch (err) {
      console.error('Failed to fetch NFTs:', err);
    } finally {
      setNftsLoading(false);
    }
  }

  // Copy wallet address
  const copyAddress = async () => {
    if (walletAddress) {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Terminal command handler
  async function handleTerminalCommand(cmd) {
    const command = cmd.trim().toLowerCase();
    
    // Add user input to output
    setTerminalOutput(prev => [...prev, { type: 'input', text: `> ${cmd}` }]);
    
    if (command === 'help') {
      setTerminalOutput(prev => [...prev, { type: 'output', text: `
🤖 GAN Terminal Commands:

💰 WALLET
  balance    - Check ETH and $GAN balance
  wallet     - Show wallet address

🎨 NFTs  
  portfolio  - List your NFTs
  mint neural - Mint Neural Networker

💸 TRANSFERS
  send [amount] $GAN to @user
  send [amount] ETH to @user

❓ OTHER
  help       - Show this help
  clear      - Clear terminal
` }]);
      return;
    }
    
    if (command === 'clear') {
      setTerminalOutput([{ type: 'system', text: '🤖 Terminal cleared' }]);
      return;
    }
    
    if (command === 'balance' || command === 'my balance') {
      if (!walletAddress) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: '❌ No wallet connected' }]);
        return;
      }
      setTerminalOutput(prev => [...prev, { 
        type: 'output', 
        text: `💰 Balance for ${twitterHandle ? '@' + twitterHandle : walletAddress.slice(0,8) + '...'}

ETH:  ${ethBalance || '0'} ETH
$GAN: ${ganBalance || '0'} GAN

🔗 BaseScan: basescan.org/address/${walletAddress}` 
      }]);
      return;
    }
    
    if (command === 'wallet' || command === 'my wallet') {
      if (!walletAddress) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: '❌ No wallet connected' }]);
        return;
      }
      setTerminalOutput(prev => [...prev, { 
        type: 'output', 
        text: `🔐 Your Wallet

Address: ${walletAddress}
${twitterHandle ? 'X: @' + twitterHandle : ''}
Chain: Base (8453)

📋 Click address above to copy` 
      }]);
      return;
    }
    
    if (command === 'portfolio' || command === 'my nfts' || command === 'list nfts') {
      if (!walletAddress) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: '❌ No wallet connected' }]);
        return;
      }
      setTerminalOutput(prev => [...prev, { type: 'system', text: '⏳ Fetching NFTs...' }]);
      
      // Switch to NFT tab
      setActiveTab('nfts');
      setTerminalOutput(prev => [...prev, { 
        type: 'output', 
        text: `📦 Found ${nfts.length} NFTs - View in NFTs tab` 
      }]);
      return;
    }
    
    if (command.includes('mint') && command.includes('neural')) {
      if (!walletAddress) {
        setTerminalOutput(prev => [...prev, { type: 'error', text: '❌ Connect wallet first' }]);
        return;
      }
      
      const ethBal = parseFloat(ethBalance || '0');
      if (ethBal < 0.008) {
        setTerminalOutput(prev => [...prev, { 
          type: 'error', 
          text: `❌ Insufficient ETH

Balance: ${ethBalance} ETH
Required: 0.008 ETH

Fund your wallet first!` 
        }]);
        return;
      }
      
      setTerminalOutput(prev => [...prev, { 
        type: 'output', 
        text: `🧠 Neural Networkers Mint

Price: 0.008 ETH
Your Balance: ${ethBalance} ETH

✅ You're eligible!

🔗 Mint at:
fractalvisions.io/collection/base/0xd1415559a3eCA34694a38A123a12cC6AC17CaFea

(Direct terminal minting coming soon!)` 
      }]);
      return;
    }
    
    if (command.startsWith('send')) {
      setTerminalOutput(prev => [...prev, { 
        type: 'output', 
        text: `💸 Transfer Feature

Coming soon! For now:
1. Use the Transfer button in Wallet tab
2. Or send directly via your wallet

Stay tuned for terminal transfers!` 
      }]);
      return;
    }
    
    // Unknown command
    setTerminalOutput(prev => [...prev, { 
      type: 'error', 
      text: `❓ Unknown command: ${cmd}\n\nType "help" for available commands` 
    }]);
  }

  // Handle terminal input
  function handleTerminalKeyDown(e) {
    if (e.key === 'Enter' && terminalInput.trim()) {
      handleTerminalCommand(terminalInput);
      setTerminalInput('');
    }
  }

  // Connected state
  if (ready && authenticated && walletAddress) {
    return (
      <div className="max-w-4xl mx-auto bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b border-gray-800 px-4">
          <div className="flex gap-1">
            {['wallet', 'nfts', 'terminal'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab 
                    ? 'text-gan-yellow' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'wallet' && '💰 Wallet'}
                {tab === 'nfts' && `🖼️ NFTs ${nfts.length > 0 ? `(${nfts.length})` : ''}`}
                {tab === 'terminal' && '⌨️ Terminal'}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gan-yellow" />
                )}
              </button>
            ))}
          </div>
          
          {/* Connected indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-400">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* WALLET TAB */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              {/* User info */}
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-1">
                  <span className="text-white">Ganland</span>{' '}
                  <span className="text-gan-yellow">Wallet</span>
                </h3>
                {twitterHandle && (
                  <a
                    href={`https://x.com/${twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-gan-yellow hover:text-gan-gold transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @{twitterHandle}
                  </a>
                )}
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-4">
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

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <a
                  href={`https://app.uniswap.org/swap?chain=base&outputCurrency=${GAN_TOKEN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors"
                >
                  Buy $GAN
                </a>
                <button
                  onClick={() => setActiveTab('terminal')}
                  className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gan-yellow hover:text-gan-yellow transition-colors"
                >
                  Transfer
                </button>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                <a
                  href={`https://basescan.org/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800/50 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  <span>📊</span> View on BaseScan
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800/50 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  <span>📋</span> Copy Address
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
          )}

          {/* NFTs TAB */}
          {activeTab === 'nfts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Your NFTs</h3>
                <button
                  onClick={() => fetchNFTs(walletAddress)}
                  disabled={nftsLoading}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {nftsLoading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {nftsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-gan-yellow border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-gray-400">Loading your NFTs...</p>
                </div>
              ) : nfts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-gray-400 mb-4">No NFTs found on Base</p>
                  <a
                    href="https://fractalvisions.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gan-yellow hover:text-gan-gold transition-colors"
                  >
                    Start collecting →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nfts.map((nft, idx) => (
                    <div
                      key={`${nft.contract}-${nft.tokenId}-${idx}`}
                      className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700 hover:border-gan-yellow/50 transition-colors group"
                    >
                      <div className="aspect-square bg-gray-900 relative">
                        {nft.image ? (
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full items-center justify-center text-4xl hidden">
                          🖼️
                        </div>
                        {nft.isKnown && (
                          <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                            {nft.knownInfo?.emoji}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-white truncate">{nft.name}</p>
                        <p className="text-xs text-gray-400 truncate">{nft.collection}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Mint CTA */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-4 border border-purple-500/30 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2">
                      🧠 Neural Networkers
                    </h4>
                    <p className="text-sm text-gray-400">Join the network • 0.008 ETH</p>
                  </div>
                  <a
                    href="https://fractalvisions.io/collection/base/0xd1415559a3eCA34694a38A123a12cC6AC17CaFea"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors text-sm"
                  >
                    Mint Now
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TERMINAL TAB */}
          {activeTab === 'terminal' && (
            <div className="space-y-4">
              {/* Terminal output */}
              <div 
                ref={terminalRef}
                className="bg-black rounded-lg p-4 h-80 overflow-y-auto font-mono text-sm"
              >
                {terminalOutput.map((line, idx) => (
                  <div 
                    key={idx}
                    className={`mb-2 whitespace-pre-wrap ${
                      line.type === 'input' ? 'text-green-400' :
                      line.type === 'error' ? 'text-red-400' :
                      line.type === 'system' ? 'text-blue-400' :
                      'text-gray-300'
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
              </div>

              {/* Terminal input */}
              <div className="flex items-center gap-2 bg-black rounded-lg px-4 py-3 border border-gray-700 focus-within:border-gan-yellow transition-colors">
                <span className="text-green-400 font-mono">{'>'}</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none placeholder-gray-600"
                  autoFocus
                />
              </div>

              {/* Quick commands */}
              <div className="flex flex-wrap gap-2">
                {['help', 'balance', 'portfolio', 'mint neural'].map(cmd => (
                  <button
                    key={cmd}
                    onClick={() => {
                      setTerminalInput(cmd);
                      handleTerminalCommand(cmd);
                      setTerminalInput('');
                    }}
                    className="px-3 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors font-mono"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not connected state
  return (
    <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
      <div className="flex flex-col items-center justify-center py-8">
        <h3 className="text-2xl font-bold mb-2">
          <span className="text-white">Ganland</span>{' '}
          <span className="text-gan-yellow">Wallet</span>
        </h3>
        <p className="text-gray-400 text-center mb-6 max-w-md">
          Connect with X to access your Ganland embedded wallet, manage $GAN tokens, and collect AI art NFTs.
        </p>

        {/* Wallet icon */}
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🔐</span>
        </div>

        {/* Connect button */}
        <button
          onClick={login}
          className="px-8 py-3 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors mb-6"
        >
          Connect with X
        </button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm mb-6">
          <div className="px-3 py-2">
            <span className="text-2xl block mb-1">💰</span>
            <span className="text-gray-400">Manage $GAN</span>
          </div>
          <div className="px-3 py-2">
            <span className="text-2xl block mb-1">🖼️</span>
            <span className="text-gray-400">View NFTs</span>
          </div>
          <div className="px-3 py-2">
            <span className="text-2xl block mb-1">⌨️</span>
            <span className="text-gray-400">Terminal</span>
          </div>
        </div>

        {/* Supported Networks */}
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {SUPPORTED_CHAINS.map((chain) => (
            <span
              key={chain.name}
              className="px-3 py-1 text-xs rounded-full"
              style={{
                backgroundColor: `${chain.color}20`,
                color: chain.color,
                border: `1px solid ${chain.color}30`,
              }}
            >
              ● {chain.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t border-gray-800 pt-4 mt-4">
        <span className="text-gray-500 text-sm">Powered by Privy</span>
      </div>
    </div>
  );
}
