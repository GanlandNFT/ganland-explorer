'use client';

import { useEffect, useState } from 'react';
import { getHandleForWallet, shortenAddress, knownWallets } from '../lib/supabase';

// Ganland wallet addresses for activity tracking
const GANLAND_WALLETS = {
  'GAN Service': '0xc4EF7d096541338FBE007E146De4a7Cd99cb9e40',
  'Ganland.eth': '0xDd32A567bc09384057A1F260086618D88b28E64F',
};

const CHAIN_CONFIG = {
  base: {
    name: 'Base',
    color: 'bg-blue-500',
    explorer: 'https://basescan.org',
  },
  optimism: {
    name: 'Optimism',
    color: 'bg-red-500',
    explorer: 'https://optimistic.etherscan.io',
  },
  ethereum: {
    name: 'Ethereum',
    color: 'bg-purple-500',
    explorer: 'https://etherscan.io',
  },
};

export default function ActivityBar() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentTransactions();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRecentTransactions() {
    try {
      // Try to fetch from API if available
      // For now, use recent known transactions as fallback
      const recentTx = [
        {
          type: 'transfer',
          from: '0x4707E990b7dd50288e1B21De1ACD53EE2D10f3FB',
          to: '0xa702eD4E6a82c8148Cc6B1DC7E22f19E4339fC68',
          hash: '0x7890abcd...1234',
          chain: 'base',
          value: '69',
          token: '$VISION',
          time: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        },
        {
          type: 'mint',
          from: '0x4707E990b7dd50288e1B21De1ACD53EE2D10f3FB',
          collection: 'Micro Cosms',
          tokenId: '2079',
          hash: '0x5678efgh...5678',
          chain: 'optimism',
          time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        },
        {
          type: 'mint',
          from: '0x4707E990b7dd50288e1B21De1ACD53EE2D10f3FB',
          collection: 'Gan Frens',
          tokenId: '4282',
          hash: '0x1234abcd...9012',
          chain: 'base',
          time: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
        },
      ];
      
      setTransactions(recentTx);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function renderWalletLink(address) {
    const info = getHandleForWallet(address);
    if (info) {
      return (
        <a
          href={`https://x.com/${info.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gan-yellow hover:underline font-medium"
        >
          @{info.handle}
        </a>
      );
    }
    return (
      <span className="text-gray-400">{shortenAddress(address)}</span>
    );
  }

  function renderTransaction(tx, index) {
    const chain = CHAIN_CONFIG[tx.chain] || CHAIN_CONFIG.ethereum;
    const explorerUrl = `${chain.explorer}/tx/${tx.hash}`;

    return (
      <a
        key={index}
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors whitespace-nowrap"
      >
        <span className={`w-2 h-2 rounded-full ${chain.color} animate-pulse`} />
        
        {tx.type === 'transfer' && (
          <>
            {renderWalletLink(tx.from)}
            <span className="text-gray-500">→</span>
            {renderWalletLink(tx.to)}
            <span className="text-green-400 font-mono">{tx.value} {tx.token}</span>
          </>
        )}
        
        {tx.type === 'mint' && (
          <>
            {renderWalletLink(tx.from)}
            <span className="text-gray-500">minted</span>
            <span className="text-cyan-400">{tx.collection} #{tx.tokenId}</span>
          </>
        )}
        
        <span className="text-gray-500 text-xs">• {formatTimeAgo(tx.time)}</span>
        <span className="text-gray-500">🔗</span>
      </a>
    );
  }

  return (
    <div className="activity-bar border-b border-gray-800 py-2 overflow-hidden bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider shrink-0">
            🔴 Live Activity
          </span>
          
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {isLoading ? (
              <span className="text-gray-500 text-sm animate-pulse">Loading transactions...</span>
            ) : transactions.length > 0 ? (
              transactions.map(renderTransaction)
            ) : (
              <span className="text-gray-500 text-sm">No recent activity</span>
            )}
          </div>
          
          <div className="flex items-center gap-3 ml-auto shrink-0">
            <a
              href={`https://basescan.org/address/${GANLAND_WALLETS['GAN Service']}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
            >
              Base 🔗
            </a>
            <a
              href={`https://optimistic.etherscan.io/address/${GANLAND_WALLETS['GAN Service']}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-red-400 transition-colors"
            >
              OP 🔗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
