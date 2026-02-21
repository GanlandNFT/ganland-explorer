'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

const SUPPORTED_CHAINS = [
  { name: 'Base', color: 'blue', id: 8453 },
  { name: 'Optimism', color: 'red', id: 10 },
  { name: 'Ethereum', color: 'purple', id: 1 },
  { name: 'Shape', color: 'cyan', id: 360 },
  { name: 'Soneium', color: 'pink', id: 1868 },
  { name: 'Unichain', color: 'orange', id: 130 },
  { name: 'Superseed', color: 'green', id: 5330 },
];

const GAN_TOKEN = '0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07';

export default function WalletSection() {
  const { ready, authenticated, user } = usePrivy();
  const [ganBalance, setGanBalance] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const walletAddress = user?.wallet?.address;

  useEffect(() => {
    if (walletAddress) {
      fetchBalances(walletAddress);
    }
  }, [walletAddress]);

  async function fetchBalances(address) {
    setLoading(true);
    try {
      // Fetch ETH balance on Base
      const ethRes = await fetch(`https://base-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getBalance',
          params: [address, 'latest']
        })
      });
      const ethData = await ethRes.json();
      if (ethData.result) {
        const ethWei = BigInt(ethData.result);
        setEthBalance((Number(ethWei) / 1e18).toFixed(4));
      }

      // Fetch $GAN balance
      const ganRes = await fetch(`https://base-mainnet.g.alchemy.com/v2/ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_call',
          params: [{
            to: GAN_TOKEN,
            data: `0x70a08231000000000000000000000000${address.slice(2)}`
          }, 'latest']
        })
      });
      const ganData = await ganRes.json();
      if (ganData.result && ganData.result !== '0x') {
        const ganWei = BigInt(ganData.result);
        const ganAmount = Number(ganWei) / 1e18;
        setGanBalance(ganAmount > 1000000 ? `${(ganAmount / 1000000).toFixed(2)}M` : ganAmount.toLocaleString());
      } else {
        setGanBalance('0');
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoading(false);
    }
  }

  // Show connected state with balances
  if (ready && authenticated && walletAddress) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-900/50 rounded-xl p-8 border border-gray-800">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">
            <span className="text-white">Ganland</span>{' '}
            <span className="text-gan-yellow">Wallet</span>
          </h3>
          <p className="text-gray-400 text-sm">
            Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          {user?.twitter?.username && (
            <a
              href={`https://x.com/${user.twitter.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-gan-yellow hover:text-gan-gold transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              @{user.twitter.username}
            </a>
          )}
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">$GAN Balance</div>
            <div className="text-2xl font-bold text-gan-yellow">
              {loading ? '...' : ganBalance || '0'}
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">ETH Balance</div>
            <div className="text-2xl font-bold text-blue-400">
              {loading ? '...' : ethBalance || '0'}
            </div>
          </div>
        </div>

        {/* Transfer Actions */}
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
            onClick={() => alert('Transfer feature coming soon!')}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:border-gan-yellow hover:text-gan-yellow transition-colors"
          >
            Transfer
          </button>
        </div>

        {/* Supported Networks */}
        <div className="flex flex-wrap justify-center gap-2 pt-4 border-t border-gray-800">
          {SUPPORTED_CHAINS.map((chain) => (
            <span
              key={chain.name}
              className="px-3 py-1 text-xs rounded-full"
              style={{
                backgroundColor: `${getChainColor(chain.color)}20`,
                color: getChainColor(chain.color),
                borderColor: `${getChainColor(chain.color)}30`,
                border: '1px solid',
              }}
            >
              ● {chain.name}
            </span>
          ))}
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

        {/* Connect prompt */}
        <p className="text-gray-500 text-sm mb-6">
          Use the <span className="text-gan-yellow">Connect Wallet</span> button above to get started
        </p>

        {/* Supported Networks */}
        <div className="flex flex-wrap justify-center gap-2 max-w-md">
          {SUPPORTED_CHAINS.map((chain) => (
            <span
              key={chain.name}
              className="px-3 py-1 text-xs rounded-full"
              style={{
                backgroundColor: `${getChainColor(chain.color)}20`,
                color: getChainColor(chain.color),
                borderColor: `${getChainColor(chain.color)}30`,
                border: '1px solid',
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

function getChainColor(color) {
  const colors = {
    blue: '#3b82f6',
    red: '#ef4444',
    purple: '#a855f7',
    cyan: '#06b6d4',
    pink: '#ec4899',
    orange: '#f97316',
    green: '#22c55e',
  };
  return colors[color] || '#9ca3af';
}
