import Link from 'next/link';

export default function DocsOverview() {
  return (
    <div>
      {/* Quick Start */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <QuickCard 
            title="Create Your Wallet"
            description="Get a Ganland wallet linked to your X account"
            command="@GanlandNFT create wallet"
            href="/docs/wallet"
          />
          <QuickCard 
            title="Generate AI Art"
            description="Create unique artwork with text prompts"
            command="@GanlandNFT generate [prompt]"
            href="/docs/art"
          />
          <QuickCard 
            title="Browse NFTs"
            description="View your NFT collection"
            command='show my NFTs'
            href="/docs/nfts"
          />
          <QuickCard 
            title="Send Tokens"
            description="Transfer $GAN or ETH to anyone"
            command="@GanlandNFT send 100 $GAN to @user"
            href="/docs/transfers"
          />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Features</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard 
            icon="💰"
            title="Wallet Commands"
            description="Create wallets, check balances, manage tokens"
            href="/docs/wallet"
          />
          <FeatureCard 
            icon="💸"
            title="Token Transfers"
            description="Send $GAN, ETH, and other tokens to users or addresses"
            href="/docs/transfers"
          />
          <FeatureCard 
            icon="🖼️"
            title="NFT Operations"
            description="Buy, sell, mint, and transfer NFTs across 7 chains"
            href="/docs/nfts"
          />
          <FeatureCard 
            icon="🎨"
            title="Art Generation"
            description="Create AI art using natural language prompts"
            href="/docs/art"
          />
          <FeatureCard 
            icon="🤖"
            title="Agent Integration"
            description="Skill files and APIs for AI agents"
            href="/docs/agents"
          />
          <FeatureCard 
            icon="🖥️"
            title="GAN Terminal"
            description="Full command interface for power users"
            href="/terminal"
            external
          />
        </div>
      </section>

      {/* Supported Chains */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Supported Chains</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ChainBadge name="Ethereum" id="1" />
          <ChainBadge name="Optimism" id="10" color="red" />
          <ChainBadge name="Base" id="8453" color="blue" />
          <ChainBadge name="Shape" id="360" />
          <ChainBadge name="Soneium" id="1868" />
          <ChainBadge name="Unichain" id="130" color="pink" />
          <ChainBadge name="Superseed" id="5330" color="green" />
        </div>
        <p className="mt-4 text-gray-500 text-sm">
          NFT operations available on all chains through the Fractal Visions marketplace.
        </p>
      </section>

      {/* Key Contracts */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Key Contracts</h2>
        <div className="space-y-3">
          <ContractRow 
            name="$GAN Token"
            address="0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07"
            chain="Base"
            type="ERC-20"
          />
          <ContractRow 
            name="ganland.eth"
            address="0xDd32A567bc09384057A1F260086618D88b28E64F"
            chain="Multi"
            note="ENS name"
          />
          <ContractRow 
            name="Neural Networkers"
            address="0xd1415559a3eCA34694a38A123a12cC6AC17CaFea"
            chain="Base"
            type="ERC-721"
          />
        </div>
      </section>

      {/* Get $GAN CTA */}
      <section>
        <div className="p-6 bg-gradient-to-r from-gan-yellow/10 to-purple-500/10 border border-gan-yellow/30 rounded-xl">
          <h3 className="text-xl font-bold text-gan-yellow mb-2">Get $GAN Tokens</h3>
          <p className="text-gray-400 mb-4">
            You need $GAN tokens to generate art. Trade on Uniswap or receive from other users.
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

function QuickCard({ title, description, command, href }) {
  return (
    <Link href={href} className="block p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gan-yellow/50 transition-colors">
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      <code className="text-gan-yellow text-xs font-mono">{command}</code>
    </Link>
  );
}

function FeatureCard({ icon, title, description, href, external }) {
  const Component = external ? 'a' : Link;
  return (
    <Component 
      href={href} 
      {...(external ? { target: '_blank' } : {})}
      className="block p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </Component>
  );
}

function ChainBadge({ name, id, color }) {
  const colors = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    default: 'bg-gray-800/50 text-gray-400 border-gray-700',
  };
  
  return (
    <div className={`px-3 py-2 rounded-lg border ${colors[color] || colors.default}`}>
      <div className="font-medium">{name}</div>
      <div className="text-xs opacity-60">Chain ID: {id}</div>
    </div>
  );
}

function ContractRow({ name, address, chain, type, note }) {
  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{name}</span>
        <div className="flex gap-2">
          {chain && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">{chain}</span>}
          {type && <span className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">{type}</span>}
        </div>
      </div>
      <code className="text-sm text-gray-400 font-mono break-all">{address}</code>
      {note && <div className="mt-1 text-xs text-gray-500">{note}</div>}
    </div>
  );
}
