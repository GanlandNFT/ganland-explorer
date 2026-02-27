'use client';

import { useState } from 'react';

export function MyCollections({ collections }) {
  const [activeTab, setActiveTab] = useState('erc721');

  const activeCollections = activeTab === 'erc721' 
    ? collections.erc721 
    : collections.erc1155;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <h2 className="text-xl font-bold mb-4">My Collections</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('erc721')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            activeTab === 'erc721'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ERC-721 ({collections.erc721.length})
        </button>
        <button
          onClick={() => setActiveTab('erc1155')}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            activeTab === 'erc1155'
              ? 'bg-cyan-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          ERC-1155 ({collections.erc1155.length})
        </button>
      </div>

      {/* Collection Grid */}
      {activeCollections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No {activeTab.toUpperCase()} collections yet
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {activeCollections.map((address, i) => (
            <CollectionCard key={address} address={address} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({ address, index }) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <a
      href={`https://optimistic.etherscan.io/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition group"
    >
      <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-3xl">
        🎨
      </div>
      <p className="font-mono text-sm text-gray-400 group-hover:text-cyan-400 transition">
        {shortAddress}
      </p>
    </a>
  );
}

export default MyCollections;
