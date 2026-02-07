'use client';

import { useEffect, useState } from 'react';

// Ganland wallet addresses for activity tracking
const GANLAND_WALLETS = {
  'GAN Service': '0xc4EF7d096541338FBE007E146De4a7Cd99cb9e40',
  'Ganland.eth': '0xDd32A567bc09384057A1F260086618D88b28E64F',
};

export default function ActivityBar() {
  const [recentTx, setRecentTx] = useState([]);
  
  useEffect(() => {
    // Fetch recent transactions from Ganland wallets
    // In production, use Alchemy/Infura webhooks or polling
    const mockTx = [
      { type: 'mint', hash: '0x1234...abcd', chain: 'base', time: '2m ago' },
      { type: 'transfer', hash: '0x5678...efgh', chain: 'optimism', time: '15m ago' },
    ];
    setRecentTx(mockTx);
  }, []);

  return (
    <div className="activity-bar py-2 px-4 text-xs">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">GANLAND ACTIVITY:</span>
          <div className="flex items-center gap-3">
            {recentTx.length > 0 ? (
              recentTx.map((tx, i) => (
                <a
                  key={i}
                  href={getExplorerUrl(tx.chain, tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <span className={`w-2 h-2 rounded-full ${tx.chain === 'base' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  <span>{tx.type}</span>
                  <span className="text-gray-500">• {tx.time}</span>
                  🔗
                </a>
              ))
            ) : (
              <span className="text-gray-500">No recent activity</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href={`https://basescan.org/address/${GANLAND_WALLETS['GAN Service']}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gan-yellow"
          >
            Base Explorer 🔗
          </a>
          <a
            href={`https://optimistic.etherscan.io/address/${GANLAND_WALLETS['GAN Service']}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gan-yellow"
          >
            OP Explorer 🔗
          </a>
        </div>
      </div>
    </div>
  );
}

function getExplorerUrl(chain, hash) {
  const explorers = {
    base: 'https://basescan.org/tx/',
    optimism: 'https://optimistic.etherscan.io/tx/',
    ethereum: 'https://etherscan.io/tx/',
  };
  return `${explorers[chain] || explorers.ethereum}${hash}`;
}
