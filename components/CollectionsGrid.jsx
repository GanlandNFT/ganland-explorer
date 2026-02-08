'use client';

const collections = [
  // BASE COLLECTIONS
  {
    name: 'Gan Frens',
    chain: 'base',
    contract: '0xdee94416167780b47127624bab7730a43187630d',
    supply: 4289,
    image: 'https://nft-cdn.alchemy.com/base-mainnet/fccb5758196028c4a7d99e64e28b0fd2',
  },
  {
    name: 'Babybirds',
    chain: 'base',
    contract: '0xef38e760918a40b13019db894e898428ffdb3aaf',
    supply: 548,
    image: 'https://nft-cdn.alchemy.com/base-mainnet/143c56cde7049e38fc43e58851fd3b89',
  },
  // OPTIMISM COLLECTIONS
  {
    name: 'Micro Cosms',
    chain: 'optimism',
    contract: '0x56f3e100a11fe5f01d7681eb887bcfb220f82118',
    supply: 2083,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/1f7af70c5a5f20357e27a88410e25f4f',
  },
  {
    name: 'Galaxy Gans',
    chain: 'optimism',
    contract: '0x40426c367f44c37e10f0a452574c2f84dcba3038',
    supply: 1111,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/8701342f0b5370e6a9f266746091d2cf',
  },
  {
    name: 'Airgans',
    chain: 'optimism',
    contract: '0x2e6a5b24bfe6c2e45a0f1af5bb5eb6e362129e2c',
    supply: 777,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/60e10acd403676c22a95af8432252cd8',
  },
  {
    name: 'Elements of Ganland',
    chain: 'optimism',
    contract: '0x70706edeea0bb9fb8a9214764066b79441528704',
    supply: 555,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/4b5b0119f0034c216ef4e8a61e7fd730',
  },
  {
    name: 'Trashgans',
    chain: 'optimism',
    contract: '0xb1eddb902ef733baf8e324e955ee6d46cce34708',
    supply: 255,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/d34e489555d5f2213b00513842bf37d1',
  },
  {
    name: 'Global Gans',
    chain: 'optimism',
    contract: '0xbb1b0da320ccc7a677a2fe00871f422e2e505fb1',
    supply: 222,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/b4cd9addd2c966423171353e08873d73',
  },
  {
    name: 'Ganland',
    chain: 'optimism',
    contract: '0x8887aeae3b19c38705ecb1c63aefdd1964beeb6b',
    supply: 222,
    image: 'https://nft-cdn.alchemy.com/opt-mainnet/531912e88666127ee78ab8a9c1f8fac7',
  },
];

export default function CollectionsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map((collection) => (
        <CollectionCard key={collection.contract} collection={collection} />
      ))}
    </div>
  );
}

function CollectionCard({ collection }) {
  const explorerUrl = collection.chain === 'base'
    ? `https://basescan.org/address/${collection.contract}`
    : `https://optimistic.etherscan.io/address/${collection.contract}`;

  const fvUrl = `https://www.fractalvisions.io/collections/${collection.contract}/collection?chain=${collection.chain}`;

  return (
    <div className="collection-card rounded-lg overflow-hidden">
      {/* Image */}
      <div className="aspect-square relative">
        <img
          src={collection.image}
          alt={collection.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className={`chain-badge ${collection.chain === 'base' ? 'chain-base' : 'chain-optimism'} text-white`}>
            {collection.chain}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold mb-2">{collection.name}</h3>
        <div className="flex justify-between text-sm text-gray-400 mb-3">
          <span>Supply: {collection.supply.toLocaleString()}</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gan-yellow hover:underline"
          >
            {collection.contract.slice(0, 6)}...{collection.contract.slice(-4)}
          </a>
        </div>
        <a
          href={fvUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2 border border-gan-yellow text-gan-yellow rounded hover:bg-gan-yellow hover:text-black transition-colors text-sm"
        >
          View Collection
        </a>
      </div>
    </div>
  );
}
