export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-2">
        <span className="text-gan-yellow">GAN</span> Documentation
      </h1>
      <p className="text-gray-400 mb-12">
        Learn how to interact with @GanlandNFT on X/Twitter
      </p>

      {/* Wallet Commands */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center text-xl">💰</span>
          <h2 className="text-2xl font-bold text-green-400">Wallet Commands</h2>
        </div>
        <p className="text-gray-400 mb-4">Create and manage your Ganland wallet for crypto transactions.</p>
        
        <div className="space-y-3">
          <CommandRow 
            command="@GanlandNFT create wallet"
            description="Create your Ganland embedded wallet. You'll receive a unique address linked to your X account."
          />
          <CommandRow 
            command="@GanlandNFT my address"
            description="Display your wallet address. Share this to receive $GAN or other tokens."
          />
          <CommandRow 
            command="@GanlandNFT balance"
            description="Check your $GAN token balance and other holdings."
          />
          <CommandRow 
            command="@GanlandNFT send 100 $GAN to @username"
            description="Transfer tokens to another user's Ganland wallet. They'll get a wallet if they don't have one."
          />
        </div>
      </section>

      {/* Art Generation Commands */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center text-xl">🎨</span>
          <h2 className="text-2xl font-bold text-cyan-400">Art Generation</h2>
        </div>
        <p className="text-gray-400 mb-4">Create AI-generated art using natural language prompts.</p>
        
        <div className="space-y-3">
          <CommandRow 
            command="@GanlandNFT generate [your prompt]"
            description="Generate AI art from your text prompt. Costs 500,000 $GAN per generation."
            example="@GanlandNFT generate a cosmic fractal dragon emerging from digital flames"
          />
          <CommandRow 
            command="@GanlandNFT generate cyberpunk [prompt]"
            description="Generate with a specific style preset. Styles: cyberpunk, fractal, ethereal, cosmic"
            example="@GanlandNFT generate cyberpunk city at sunset with neon lights"
          />
        </div>

        <div className="mt-6 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold text-gan-yellow mb-2">💡 Generation Tips</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Be descriptive — more details = better results</li>
            <li>• Mention colors, moods, and styles you want</li>
            <li>• Generated art appears as a reply to your tweet</li>
            <li>• You can mint your creations as NFTs (coming soon)</li>
          </ul>
        </div>
      </section>

      {/* NFT Commands */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center text-xl">🖼️</span>
          <h2 className="text-2xl font-bold text-purple-400">NFT Commands</h2>
        </div>
        <p className="text-gray-400 mb-4">Mint and manage NFTs on Base & Optimism.</p>
        
        <div className="space-y-3">
          <CommandRow 
            command="@GanlandNFT collections"
            description="View available NFT collections on Ganland."
            status="active"
          />
          <CommandRow 
            command="@GanlandNFT mint [collection]"
            description="Mint an NFT from a collection. Requires sufficient balance."
            status="coming"
          />
          <CommandRow 
            command="@GanlandNFT my nfts"
            description="View NFTs in your Ganland wallet."
            status="coming"
          />
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 bg-yellow-500/20 text-yellow-400 rounded-lg flex items-center justify-center text-xl">📊</span>
          <h2 className="text-2xl font-bold text-yellow-400">Pricing</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gan-yellow">500,000 $GAN</div>
            <div className="text-gray-400">Per AI art generation</div>
            <div className="text-sm text-gray-500 mt-2">≈ $0.12 USD</div>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-green-400">FREE</div>
            <div className="text-gray-400">Wallet creation & transfers</div>
            <div className="text-sm text-gray-500 mt-2">No gas fees for users</div>
          </div>
        </div>
      </section>

      {/* Get $GAN */}
      <section>
        <div className="p-6 bg-gradient-to-r from-gan-yellow/10 to-purple-500/10 border border-gan-yellow/30 rounded-xl">
          <h3 className="text-xl font-bold text-gan-yellow mb-2">Get $GAN Tokens</h3>
          <p className="text-gray-400 mb-4">
            You need $GAN tokens to generate art. Get them on Uniswap or receive them from other users.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="https://app.uniswap.org/swap?chain=base&outputCurrency=0xc2fa8cfa51b02fdeb84bb22d3c9519aeb498b07"
              target="_blank"
              className="px-4 py-2 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors"
            >
              Trade on Uniswap
            </a>
            <a 
              href="https://dexscreener.com/base/0xc2fa8cfa51b02fdeb84bb22d3c9519aeb498b07"
              target="_blank"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              View on DexScreener
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function CommandRow({ command, description, example, status }) {
  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <code className="text-gan-yellow font-mono text-sm">{command}</code>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
          {example && (
            <p className="text-gray-500 text-xs mt-2 font-mono">
              Example: <span className="text-gray-400">{example}</span>
            </p>
          )}
        </div>
        {status === 'coming' && (
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full whitespace-nowrap">
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}
