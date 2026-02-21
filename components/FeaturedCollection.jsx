'use client';

export default function FeaturedCollection() {
  const collection = {
    name: 'GANLAND 222',
    description: 'The original GANLAND collection - one of the first L2 NFT collections on Optimism (2022). A historic piece of the Fractal Visions journey.',
    contract: '0x70706edeea0bb9fb8a9214764066b79441528704',
    chain: 'optimism',
    supply: 222,
    image: 'https://ipfs.io/ipfs/QmNTAGpipz7TRNsPaid1vSrUpW6gfRHYYxZiQ8Fja1kNg9/1.png',
  };

  return (
    <div className="featured-banner rounded-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Collection Image */}
        <div className="w-full md:w-1/3">
          <img
            src={collection.image}
            alt={collection.name}
            className="w-full aspect-square object-cover rounded-lg"
            onError={(e) => {
              e.target.src = '/gan-logo.jpg';
            }}
          />
        </div>

        {/* Collection Info */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
            <span className="chain-badge chain-optimism text-white">Optimism</span>
            <span className="text-gan-yellow text-sm">★ FEATURED</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gan-yellow mb-3">
            {collection.name}
          </h2>
          
          <p className="text-gray-300 mb-4 max-w-lg">
            {collection.description}
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
            <div>
              <span className="text-gray-500">Supply:</span>{' '}
              <span className="text-white">{collection.supply}</span>
            </div>
            <div>
              <span className="text-gray-500">Contract:</span>{' '}
              <a
                href={`https://optimistic.etherscan.io/address/${collection.contract}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gan-yellow hover:underline"
              >
                {collection.contract.slice(0, 6)}...{collection.contract.slice(-4)}
              </a>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center md:justify-start">
            <a
              href={`https://www.fractalvisions.io/collections/${collection.contract}/collection?chain=optimism`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 bg-gan-yellow text-black font-bold rounded hover:bg-gan-gold transition-colors"
            >
              View on Fractal Visions
            </a>
            <a
              href={`https://opensea.io/collection/ganland-222`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 border border-gan-yellow text-gan-yellow rounded hover:bg-gan-yellow hover:text-black transition-colors"
            >
              OpenSea
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
