import dynamic from 'next/dynamic';
import CollectionsGrid from '../components/CollectionsGrid';

// Dynamic imports for client-only components
const ArtGallery = dynamic(() => import('../components/ArtGallery'), { ssr: false });
const FeaturedArtists = dynamic(() => import('../components/FeaturedArtists'), { ssr: false });
const WalletSection = dynamic(() => import('../components/WalletSection'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-900/50 rounded-xl animate-pulse" />
});
const PrivyErrorBoundary = dynamic(() => import('../components/PrivyErrorBoundary'), { ssr: false });

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <div className="inline-block mb-4 px-4 py-1 bg-gray-800/50 rounded-full border border-gray-700">
          <span className="text-sm text-gray-400">⚡ Powered by </span>
          <a href="https://fractalvisions.io" className="text-gan-yellow hover:underline text-sm">Fractal Visions</a>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-2">
          <span className="bg-gradient-to-r from-gan-yellow via-purple-400 to-cyan-400 bg-clip-text text-transparent">Ganland</span>
        </h1>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Explorer</h2>
        
        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Discover AI-generated art, explore the <span className="text-gan-yellow">$GAN</span> token ecosystem, and browse NFT collections across <span className="text-blue-400">Base</span> & <span className="text-red-400">Optimism</span>.
        </p>
        
        <div className="flex justify-center gap-4">
          <a href="https://gan-mandala-mint.vercel.app" target="_blank" className="px-8 py-3 bg-gradient-to-r from-red-500 to-gan-yellow text-black font-bold rounded-lg hover:shadow-lg hover:shadow-gan-yellow/30 transition-all">
            Mint NFT
          </a>
          <a href="#gallery" className="px-8 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gan-yellow rounded-lg transition-colors font-medium">
            View Gallery
          </a>
        </div>
      </section>

      {/* Featured Artists Carousel */}
      <FeaturedArtists />

      {/* $GAN Token Section */}
      <section id="token" className="scroll-mt-20">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full mb-4">Base Network</span>
          <h2 className="text-3xl font-bold">
            <span className="text-gan-yellow">$GAN</span> Token
          </h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            The native token powering the Ganland AI art ecosystem. Trade, Hold, Mint, and Create Art.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/gan-logo.jpg" alt="$GAN" className="w-12 h-12 rounded-lg" />
                <div>
                  <div className="font-bold text-xl">$GAN</div>
                  <div className="text-gray-500 text-sm">Ganland Token</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">Contract Address</div>
                  <div className="font-mono text-sm text-white break-all">0xc2fa8cfa51b02fdeb84bb22d3c9519aeb498b07</div>
                  <div className="text-xs text-gray-500 mt-1">Click to copy</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Network</div>
                    <div className="text-blue-400 font-medium">Base</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-white font-medium">ERC-20</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <a href="https://dexscreener.com/base/0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                📊 View on DexScreener
              </a>
              <a href="https://basescan.org/token/0xc2fa8cfa51b02fdeb84bb22d3c9519eaeb498b07" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
                🔍 View on Basescan
              </a>
              <a href="https://app.uniswap.org/explore/tokens/base/0xc2fa8cfa51b02fdeb84bb22d3c9519eaeb498b07?inputCurrency=NATIVE" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors">
                🚀 Trade on Uniswap
              </a>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center text-sm">
            ⚠️ <strong>Note:</strong> Always verify the contract address before trading. Official: <code className="text-gan-yellow">0xc2fa...8b07</code>
          </div>
        </div>
      </section>

      {/* Wallet Section */}
      <section id="wallet" className="scroll-mt-20">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full mb-4">Ganland Wallet</span>
          <h2 className="text-3xl font-bold">
            <span className="text-white">Ganland</span> <span className="text-purple-400">Wallet</span>
          </h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            Connect with X to access your Ganland embedded wallet, manage $GAN tokens, and collect AI art NFTs.
          </p>
        </div>
        <WalletSection />
      </section>

      {/* Art Gallery Section */}
      <section id="gallery" className="scroll-mt-20">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full mb-4">AI Generated</span>
          <h2 className="text-3xl font-bold">
            <span className="text-white">Art</span> <span className="text-cyan-400">Gallery</span>
          </h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            Explore GAN-generated artwork. Each piece is a unique creation from our AI agent, posted on the <a href="https://x.com/GanlandNFT" className="text-gan-yellow hover:underline">@GanlandNFT</a> timeline.
          </p>
        </div>
        <ArtGallery />
      </section>

      {/* NFT Collections Section */}
      <section id="collections" className="scroll-mt-20">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full mb-4">Multi-Chain</span>
          <h2 className="text-3xl font-bold">
            <span className="text-white">NFT</span> <span className="text-green-400">Collections</span>
          </h2>
          <p className="text-gray-400 mt-2 max-w-xl mx-auto">
            Browse Ganland NFT collections deployed on Base and Optimism. All collections are available on the Fractal Visions marketplace.
          </p>
        </div>
        <CollectionsGrid />
        
        <div className="text-center mt-8">
          <a 
            href="https://fractalvisions.io" 
            target="_blank" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Explore All on Fractal Visions ↗
          </a>
        </div>
      </section>
    </div>
  );
}
