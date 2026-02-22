import { DocsSection, InfoBox } from '../../../components/DocsLayout';

export const metadata = {
  title: 'Agent Integration | GANLAND Docs',
  description: 'Integrate AI agents with Ganland for NFT minting and art generation',
};

export default function AgentsDocsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-gray-400 text-lg">
          Give your AI agent the ability to mint NFTs, generate art, and interact with the Ganland ecosystem.
        </p>
      </div>

      <DocsSection 
        title="Skill File" 
        icon="📄"
        description="Load the Ganland skill to teach your agent"
      >
        <div className="p-4 bg-gray-900/80 rounded-lg font-mono text-sm mb-4">
          <span className="text-gray-500">$</span> curl -s https://ganland.ai/skill.md
        </div>
        
        <p className="text-gray-400 mb-4">
          The skill file contains everything your agent needs to interact with Ganland:
        </p>
        
        <ul className="space-y-2 text-gray-400">
          <li>✅ Contract addresses and ABIs</li>
          <li>✅ Mint function signatures</li>
          <li>✅ Chain configurations (Base)</li>
          <li>✅ Pricing information</li>
          <li>✅ Example interactions</li>
        </ul>
      </DocsSection>

      <DocsSection 
        title="Neural Networkers Mint" 
        icon="🔮"
        description="Mint a Neural Networker mandala programmatically"
      >
        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg mb-4">
          <h4 className="font-bold text-purple-400 mb-3">Contract Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Contract</span>
              <code className="text-gray-300">0xd1415559a3eCA34694a38A123a12cC6AC17CaFea</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Chain</span>
              <span className="text-blue-400">Base (8453)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Price</span>
              <span>0.008 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Max Per Wallet</span>
              <span>1</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-900/80 rounded-lg font-mono text-xs overflow-x-auto">
          <pre className="text-green-400">{`// Claim function
claim(
  receiver: address,      // Wallet receiving the NFT
  quantity: 1,            // Always 1 (max per wallet)
  currency: 0xEeee...EEeE // ETH address
  pricePerToken: 0.008e18 // 0.008 ETH in wei
  allowlistProof: {
    proof: [],
    quantityLimitPerWallet: 1,
    pricePerToken: 0.008e18,
    currency: 0xEeee...EEeE
  },
  data: 0x
) payable`}</pre>
        </div>
      </DocsSection>

      <DocsSection 
        title="Art Generation API" 
        icon="🎨"
        description="Generate art programmatically"
      >
        <InfoBox type="info" title="Coming Soon">
          Direct API access for art generation is coming soon. Currently, art generation is available via X mentions to @GanlandNFT.
        </InfoBox>
        
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold mb-2">Current Method: X Mention</h4>
          <p className="text-gray-400 text-sm mb-2">
            Your agent can post to X mentioning @GanlandNFT:
          </p>
          <code className="text-gan-yellow text-sm">@GanlandNFT generate [prompt]</code>
          <p className="text-gray-500 text-xs mt-2">Cost: 500,000 $GAN</p>
        </div>
      </DocsSection>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">🔗 Supported Chains</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="py-3 px-4">Chain</th>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">RPC</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-white">Ethereum</td>
                <td className="py-3 px-4">1</td>
                <td className="py-3 px-4 font-mono text-xs">Alchemy</td>
                <td className="py-3 px-4"><span className="text-green-400">✅</span></td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-red-400">Optimism</td>
                <td className="py-3 px-4">10</td>
                <td className="py-3 px-4 font-mono text-xs">Alchemy</td>
                <td className="py-3 px-4"><span className="text-green-400">✅</span></td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-blue-400">Base</td>
                <td className="py-3 px-4">8453</td>
                <td className="py-3 px-4 font-mono text-xs">Alchemy</td>
                <td className="py-3 px-4"><span className="text-green-400">✅ Primary</span></td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-white">Shape</td>
                <td className="py-3 px-4">360</td>
                <td className="py-3 px-4 font-mono text-xs">shape.network</td>
                <td className="py-3 px-4"><span className="text-green-400">✅</span></td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-white">Soneium</td>
                <td className="py-3 px-4">1868</td>
                <td className="py-3 px-4 font-mono text-xs">soneium.org</td>
                <td className="py-3 px-4"><span className="text-green-400">✅</span></td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-pink-400">Unichain</td>
                <td className="py-3 px-4">130</td>
                <td className="py-3 px-4 font-mono text-xs">unichain.org</td>
                <td className="py-3 px-4"><span className="text-green-400">✅</span></td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-green-400">Superseed</td>
                <td className="py-3 px-4">5330</td>
                <td className="py-3 px-4 font-mono text-xs">superseed.xyz</td>
                <td className="py-3 px-4"><span className="text-green-400">✅</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">📦 Related Repositories</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <RepoCard 
            name="ganland-skills"
            description="Agent skills for NFT creation and art generation"
            url="https://github.com/GanlandNFT/ganland-skills"
          />
          <RepoCard 
            name="ganland-wallet"
            description="HD wallet system for social accounts"
            url="https://github.com/GanlandNFT/ganland-wallet"
          />
          <RepoCard 
            name="gan-art-service"
            description="AI art generation with $GAN payments"
            url="https://github.com/GanlandNFT/gan-art-service"
          />
          <RepoCard 
            name="gan-payment-service"
            description="Payment verification and order tracking"
            url="https://github.com/GanlandNFT/gan-payment-service"
          />
        </div>
      </section>

      <div className="mt-8">
        <InfoBox type="tip" title="Need Help?">
          <p>
            For integration support, reach out on <a href="https://x.com/GanlandNFT" className="text-gan-yellow hover:underline">X/Twitter</a> or check the skill file documentation.
          </p>
        </InfoBox>
      </div>
    </div>
  );
}

function RepoCard({ name, description, url }) {
  return (
    <a 
      href={url}
      target="_blank"
      className="block p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
    >
      <h4 className="font-mono text-gan-yellow mb-1">{name}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </a>
  );
}
