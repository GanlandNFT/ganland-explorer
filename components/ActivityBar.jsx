'use client';

import { useEffect, useState } from 'react';
import { getHandleForWallet, shortenAddress } from '../lib/supabase';

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
    const interval = setInterval(fetchRecentTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchRecentTransactions() {
    try {
      const response = await fetch('/api/transactions');
      const data = await response.json();
      
      if (data.success && data.transactions?.length > 0) {
        const formattedTx = data.transactions.map(tx => ({
          type: tx.tokenId ? 'mint' : 'transfer',
          from: tx.from,
          to: tx.to,
          fromHandle: tx.fromHandle,
          toHandle: tx.toHandle,
          hash: tx.hash,
          chain: tx.chain,
          value: tx.value,
          token: tx.asset,
          tokenId: tx.tokenId,
          time: new Date(tx.timestamp),
        }));
        setTransactions(formattedTx);
      } else {
        setTransactions([
          {
            type: 'transfer',
            from: '0x4707E990b7dd50288e1B21De1ACD53EE2D10f3FB',
            to: '0xa702eD4E6a82c8148Cc6B1DC7E22f19E4339fC68',
            fromHandle: 'fractalvisions',
            toHandle: 'BeforeDay1',
            hash: '0x7890abcd1234',
            chain: 'base',
            value: '69',
            token: '$VISION',
            time: new Date(Date.now() - 1000 * 60 * 30),
          },
        ]);
      }
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

  function renderWalletLink(address, handle) {
    const info = handle ? { handle } : getHandleForWallet(address);
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
        <span className={`w-2 h-2 rounded-full ${chain.color}`} />
        
        {tx.type === 'transfer' && (
          <>
            {renderWalletLink(tx.from, tx.fromHandle)}
            <span className="text-gray-500">→</span>
            {renderWalletLink(tx.to, tx.toHandle)}
            {tx.value && <span className="text-green-400 font-mono">{tx.value} {tx.token}</span>}
          </>
        )}
        
        {tx.type === 'mint' && (
          <>
            {renderWalletLink(tx.from, tx.fromHandle)}
            <span className="text-gray-500">minted</span>
            <span className="text-cyan-400">NFT #{tx.tokenId}</span>
          </>
        )}
        
        <span className="text-gray-500 text-xs">• {formatTimeAgo(tx.time)}</span>
      </a>
    );
  }

  return (
    <div className="activity-bar border-b border-gray-800 py-2 overflow-hidden bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4">
          {/* Blinking red dot + Live Activity label */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="live-dot w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Live Activity
            </span>
          </div>
          
          {/* Transactions - full width */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {isLoading ? (
              <span className="text-gray-500 text-sm animate-pulse">Loading transactions...</span>
            ) : transactions.length > 0 ? (
              transactions.map(renderTransaction)
            ) : (
              <span className="text-gray-500 text-sm">No recent activity</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
