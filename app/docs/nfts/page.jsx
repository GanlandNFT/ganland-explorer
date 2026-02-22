import { CommandRow, DocsSection, InfoBox } from '../../../components/DocsLayout';

export const metadata = {
  title: 'NFT Commands | GANLAND Docs',
  description: 'Buy, sell, mint, and transfer NFTs across EVM chains via @GanlandNFT',
};

export default function NFTDocsPage() {
  return (
    <div>
      {/* Intro */}
      <div className="mb-8">
        <p className="text-gray-400 text-lg">
          Buy, sell, mint, and transfer NFTs across EVM chains. All operations work through the Fractal Visions marketplace.
        </p>
      </div>

      {/* Supported Chains */}
      <div className="mb-8 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
        <h3 className="font-bold mb-3">Supported Chains</h3>
        <div className="flex flex-wrap gap-2">
          {['Ethereum', 'Optimism', 'Base', 'Shape', 'Soneium', 'Unichain', 'Superseed'].map(chain => (
            <span key={chain} className="px-3 py-1 bg-gray-800 rounded-full text-sm">{chain}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          Only available for NFTs on Fractal Visions NFT marketplace.
        </p>
      </div>

      {/* Viewing NFTs */}
      <DocsSection 
        title="Viewing NFTs" 
        icon="👀"
        description="Check your collection and browse marketplace data"
      >
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Your Collection</h4>
        <CommandRow 
          command="show my NFTs"
          description="Display all NFTs in your Ganland wallet across all chains"
        />
        <CommandRow 
          command="what NFTs do I own?"
          description="Alternative way to view your NFT collection"
        />
        <CommandRow 
          command="my NFTs on base"
          description="Filter NFTs by specific chain"
          example="my NFTs on optimism"
        />

        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6">Collection Info</h4>
        <CommandRow 
          command="show the floor price for [collection]"
          description="Get current floor price for a collection"
          example="show the floor price for Gan Frens"
        />
        <CommandRow 
          command="trending NFT collections"
          description="View trending collections on Fractal Visions"
        />
        <CommandRow 
          command="top NFTs on [chain]"
          description="Show top collections on a specific chain"
          example="top NFTs on base"
        />
      </DocsSection>

      {/* Buying NFTs */}
      <DocsSection 
        title="Buying NFTs" 
        icon="🛒"
        description="Purchase NFTs from the Fractal Visions marketplace"
      >
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">From Fractal Visions</h4>
        <CommandRow 
          command="buy this NFT: [fractalvisions.io link]"
          description="Buy a specific NFT using its marketplace link (most reliable method)"
          example="buy this NFT: https://fractalvisions.io/listing/base/0xDeE.../80"
        />
        <CommandRow 
          command="buy the cheapest [collection]"
          description="Buy the floor price NFT from a collection"
          example="buy the cheapest Gan Frens"
        />
        <CommandRow 
          command="buy floor [collection]"
          description="Alternative syntax for buying floor"
          example="buy floor Micro Cosms"
        />
        
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6">By Collection</h4>
        <CommandRow 
          command="buy the cheapest NFT from [collection]"
          description="Explicit floor purchase"
          example="buy the cheapest NFT from Gan Frens"
        />
        <CommandRow 
          command="show me listings for [collection] under [price] ETH"
          description="Browse listings within a price range"
          example="show me listings for Micro Cosms under 0.1 ETH"
        />

        <InfoBox type="tip" title="Use Links for Reliability">
          The most reliable way to identify an NFT is with its Fractal Visions link:
          <code className="block mt-2 text-xs">"buy this: [fractalvisions.io link]"</code>
        </InfoBox>
      </DocsSection>

      {/* Selling NFTs */}
      <DocsSection 
        title="Selling NFTs" 
        icon="💰"
        description="List your NFTs for sale or manage existing listings"
      >
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">List for Sale</h4>
        <CommandRow 
          command="list my [collection] #[id] for [price] ETH"
          description="List a specific NFT for sale"
          example="list my Gan Frens #123 for 50 ETH"
        />
        <CommandRow 
          command="sell my NFT for [price] ETH"
          description="List your NFT at a specific price"
          example="sell my NFT for 0.5 ETH"
        />

        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6">Cancel Listing</h4>
        <CommandRow 
          command="cancel my NFT listing"
          description="Remove your NFT from sale"
        />
        <CommandRow 
          command="remove my [collection] from sale"
          description="Cancel listing for specific collection"
          example="remove my Gan Frens from sale"
        />

        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6">Accept Offers</h4>
        <CommandRow 
          command="what offers do I have on my NFTs?"
          description="View all pending offers on your NFTs"
        />
        <CommandRow 
          command="accept the best offer on my [collection]"
          description="Accept the highest offer"
          example="accept the best offer on my Gan Frens"
        />
      </DocsSection>

      {/* Minting NFTs */}
      <DocsSection 
        title="Minting NFTs" 
        icon="✨"
        description="Mint new NFTs from Fractal Visions collections"
      >
        <CommandRow 
          command="mint from [fractalvisions.io link]"
          description="Mint from a specific collection using link"
          example="mint from https://fractalvisions.io/mint/..."
        />
        <CommandRow 
          command="mint this NFT: [link]"
          description="Alternative mint syntax"
        />
        <CommandRow 
          command="mint neural"
          description="Mint a Neural Networker mandala (0.008 ETH on Base)"
          status="new"
        />
        
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6">Featured Mints</h4>
        <CommandRow 
          command="what's minting today?"
          description="Show today's featured mints"
        />
        <CommandRow 
          command="show featured NFT mints"
          description="Browse all featured mint opportunities"
        />
      </DocsSection>

      {/* Transferring NFTs */}
      <DocsSection 
        title="Transferring NFTs" 
        icon="📤"
        description="Send NFTs to other wallets or users"
      >
        <CommandRow 
          command="send my [collection] #[id] to 0x..."
          description="Transfer NFT to a wallet address"
          example="send my Gan Frens #123 to 0x1234..."
        />
        <CommandRow 
          command="transfer my NFT to [ENS]"
          description="Transfer NFT using ENS name"
          example="transfer my NFT to vitalik.eth"
        />
        <CommandRow 
          command="send this NFT to @username"
          description="Transfer NFT to another X user's Ganland wallet"
          example="send this NFT to @artfractalicia"
        />

        <InfoBox type="danger" title="Verify Transfers">
          Always double-check recipient addresses — NFT transfers are <strong>irreversible</strong>.
        </InfoBox>
      </DocsSection>

      {/* Searching Collections */}
      <DocsSection 
        title="Searching Collections" 
        icon="🔍"
        description="Find and explore NFT collections"
      >
        <CommandRow 
          command="search for [collection]"
          description="Search for a collection by name"
          example="search for Gan Frens"
        />
        <CommandRow 
          command="find NFT collection: [name]"
          description="Alternative search syntax"
          example="find NFT collection: Micro Cosms"
        />
      </DocsSection>

      {/* Pricing & Fees */}
      <section className="mt-12 p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
        <h2 className="text-xl font-bold mb-4">💸 Pricing & Fees</h2>
        <ul className="space-y-2 text-gray-400">
          <li>• NFTs are priced in <strong className="text-white">ETH</strong> (or custom ERC20 tokens per network)</li>
          <li>• Ensure sufficient balance for <strong className="text-white">purchase + gas</strong></li>
          <li>• Fractal Visions marketplace fees apply on sales</li>
          <li>• Transfers only require gas fees</li>
        </ul>
      </section>

      {/* Limitations */}
      <section className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Limitations</h2>
        <ul className="space-y-2 text-gray-400">
          <li>• <strong className="text-white">Not available on Solana</strong> — EVM chains only</li>
          <li>• Some collections may not be indexed yet</li>
          <li>• Marketplace specific to <strong className="text-white">Fractal Visions collection registry</strong></li>
        </ul>
      </section>

      {/* Examples */}
      <section className="mt-12">
        <h2 className="text-xl font-bold mb-6">📝 Full Examples</h2>
        <div className="space-y-4">
          <ExampleCard 
            title="Buy a Specific NFT"
            command='buy https://www.fractalvisions.io/listing/base/0xDeE94416167780B47127624BAB7730a43187630D/80?listing_id=719&creator_address=0xDd32A567bc09384057A1F260086618D88b28E64F'
          />
          <ExampleCard 
            title="Buy Floor"
            commands={[
              'buy the cheapest Gan Frens',
              'buy floor Micro Cosms'
            ]}
          />
          <ExampleCard 
            title="List and Sell"
            command="list my NFT #42 for 1 ETH on base"
          />
          <ExampleCard 
            title="Check Offers"
            commands={[
              'show offers on my NFTs',
              'best offer for my Gan Frens?'
            ]}
          />
          <ExampleCard 
            title="View Before Buying"
            commands={[
              'show details for [fractalvisions.io link]',
              'buy it'
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function ExampleCard({ title, command, commands }) {
  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
      <h4 className="font-medium text-gan-yellow mb-2">{title}</h4>
      {command ? (
        <code className="text-sm text-gray-400 font-mono break-all">{command}</code>
      ) : (
        <div className="space-y-1">
          {commands.map((cmd, i) => (
            <code key={i} className="block text-sm text-gray-400 font-mono">{cmd}</code>
          ))}
        </div>
      )}
    </div>
  );
}
