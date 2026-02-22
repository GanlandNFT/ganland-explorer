import { CommandRow, DocsSection, InfoBox } from '../../../components/DocsLayout';

export const metadata = {
  title: 'Wallet Commands | GANLAND Docs',
  description: 'Create and manage your Ganland wallet',
};

export default function WalletDocsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-gray-400 text-lg">
          Create and manage your Ganland wallet. Wallets are embedded via Privy and linked to your X account.
        </p>
      </div>

      <DocsSection 
        title="Create Wallet" 
        icon="🔐"
        description="Get your Ganland wallet linked to your X account"
      >
        <CommandRow 
          command="@GanlandNFT create wallet"
          description="Create a new Ganland embedded wallet. Your wallet address will be deterministically derived from your X user ID."
        />
        
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold text-green-400 mb-2">Response:</h4>
          <div className="text-gray-400 text-sm space-y-1">
            <p>✅ Wallet created!</p>
            <p>Address: <code className="text-gan-yellow">0x1234...abcd</code></p>
            <p className="text-gray-500">Fund it to start using Ganland features.</p>
          </div>
        </div>
      </DocsSection>

      <DocsSection 
        title="View Address" 
        icon="📍"
        description="Display your wallet address for receiving funds"
      >
        <CommandRow 
          command="@GanlandNFT my address"
          description="Show your Ganland wallet address. Share this to receive $GAN, ETH, or NFTs."
        />
        <CommandRow 
          command="show my address"
          description="Alternative command syntax"
        />
      </DocsSection>

      <DocsSection 
        title="Check Balance" 
        icon="💰"
        description="View your token and NFT holdings"
      >
        <CommandRow 
          command="@GanlandNFT balance"
          description="Check your complete wallet balance including tokens and NFTs across all supported chains."
        />
        <CommandRow 
          command="check balance"
          description="Alternative command syntax"
        />
        
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold text-green-400 mb-2">Response:</h4>
          <div className="text-gray-400 text-sm space-y-1">
            <p>💰 <strong>Your Balance</strong></p>
            <p><strong>Tokens:</strong></p>
            <p>• 50,000 $VISION</p>
            <p>• 100,000 $GAN</p>
            <p>• 0.01 ETH</p>
            <p className="mt-2"><strong>NFTs:</strong></p>
            <p>• GAN Frens: #42, #99</p>
            <p>• Micro Cosms: #326</p>
          </div>
        </div>
      </DocsSection>

      <DocsSection 
        title="Help" 
        icon="❓"
        description="Get command reference"
      >
        <CommandRow 
          command="@GanlandNFT help"
          description="Show all available commands and syntax"
        />
      </DocsSection>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">💡 Funding Your Wallet</h2>
        <p className="text-gray-400 mb-4">
          Your Ganland wallet lives on <strong className="text-blue-400">Base</strong> (Chain ID: 8453). To use it, fund with:
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h4 className="font-bold text-gan-yellow mb-2">ETH</h4>
            <p className="text-gray-400 text-sm">For gas fees (~$0.01 per transaction)</p>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h4 className="font-bold text-gan-yellow mb-2">$GAN</h4>
            <p className="text-gray-400 text-sm">For art generation (500,000 $GAN per artwork)</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <a 
            href="https://bridge.base.org" 
            target="_blank"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            🌉 Bridge to Base
          </a>
          <a 
            href="https://app.uniswap.org/swap?chain=base&outputCurrency=0xc2fa8cfa51b02fdeb84bb22d3c9519aeb498b07" 
            target="_blank"
            className="px-4 py-2 bg-gan-yellow text-black font-bold rounded-lg hover:bg-gan-gold transition-colors"
          >
            🦄 Buy $GAN
          </a>
        </div>
      </section>

      <InfoBox type="info" title="HD Wallet Security">
        <ul className="space-y-1">
          <li>• Wallets are deterministically derived from your X user ID</li>
          <li>• No private keys stored in database</li>
          <li>• Same user always gets the same wallet address</li>
          <li>• Standard BIP-44 derivation path</li>
        </ul>
      </InfoBox>
    </div>
  );
}
