import { CommandRow, DocsSection, InfoBox } from '../../../components/DocsLayout';

export const metadata = {
  title: 'Token Transfers | GANLAND Docs',
  description: 'Send $GAN, ETH, and other tokens via @GanlandNFT',
};

export default function TransfersDocsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-gray-400 text-lg">
          Transfer tokens to X users or wallet addresses. Recipients automatically get a Ganland wallet if they don't have one.
        </p>
      </div>

      <DocsSection 
        title="Send to Username" 
        icon="👤"
        description="Transfer tokens to another X user's Ganland wallet"
      >
        <CommandRow 
          command="@GanlandNFT send [amount] $GAN to @username"
          description="Send $GAN tokens to an X user. Auto-creates their wallet if needed."
          example="@GanlandNFT send 500 $VISION to @artfractalicia"
        />
        <CommandRow 
          command="@GanlandNFT send [amount] ETH to @username"
          description="Send ETH to an X user"
          example="@GanlandNFT send 0.01 ETH to @IGLIVISION"
        />
        
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold text-green-400 mb-2">Response:</h4>
          <div className="text-gray-400 text-sm">
            <p>✅ Sent 1,000 $VISION to @username</p>
            <p className="text-blue-400 mt-1">[View transaction]</p>
          </div>
        </div>
      </DocsSection>

      <DocsSection 
        title="Send to Address" 
        icon="📬"
        description="Transfer tokens to any wallet address"
      >
        <CommandRow 
          command="@GanlandNFT send [amount] $GAN to 0x..."
          description="Send tokens to a specific wallet address"
          example="@GanlandNFT send 50000 $GAN to 0x4707E990b7dd50288e1B21De1ACD53EE2D10f3FB"
        />
        <CommandRow 
          command="@GanlandNFT send [amount] ETH to 0x..."
          description="Send ETH to any address"
          example="@GanlandNFT send 0.005 ETH to 0xDd32A567bc09384057A1F260086618D88b28E64F"
        />
      </DocsSection>

      <DocsSection 
        title="Multi-Send" 
        icon="👥"
        description="Send tokens to multiple recipients at once"
      >
        <CommandRow 
          command="@GanlandNFT send [amount] $GAN to @user1 @user2 @user3"
          description="Distribute tokens to multiple X users in one transaction"
          example="@GanlandNFT send 100 $VISION to @user1 @user2 @user3"
        />
        
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold text-green-400 mb-2">Response:</h4>
          <div className="text-gray-400 text-sm">
            <p>✅ Sent 100 $VISION to 3 recipients</p>
            <p>• @user1 ✓</p>
            <p>• @user2 ✓</p>
            <p>• @user3 ✓</p>
          </div>
        </div>
      </DocsSection>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">🪙 Supported Tokens</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Chain</th>
                <th className="py-3 px-4">Contract</th>
              </tr>
            </thead>
            <tbody className="text-gray-400">
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-gan-yellow">$GAN</td>
                <td className="py-3 px-4">Base</td>
                <td className="py-3 px-4 font-mono text-xs">0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-purple-400">$VISION</td>
                <td className="py-3 px-4">Base</td>
                <td className="py-3 px-4 font-mono text-xs">0x50d7a818e5e339ebe13b17e130b5b608fac354dc</td>
              </tr>
              <tr className="border-b border-gray-800/50">
                <td className="py-3 px-4 font-medium text-red-400">$OP</td>
                <td className="py-3 px-4">Optimism</td>
                <td className="py-3 px-4 font-mono text-xs">Native</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-blue-400">ETH</td>
                <td className="py-3 px-4">All chains</td>
                <td className="py-3 px-4 font-mono text-xs">Native</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <InfoBox type="tip" title="Transfer Tips">
        <ul className="space-y-1">
          <li>• Transfers are <strong>free</strong> — only gas fees apply</li>
          <li>• Recipients without wallets get one automatically</li>
          <li>• Always double-check usernames before sending</li>
          <li>• Use ENS names for address verification</li>
        </ul>
      </InfoBox>

      <div className="mt-6">
        <InfoBox type="warning" title="Gas Requirements">
          <p>Make sure you have enough ETH for gas fees (~$0.01 per transfer on Base).</p>
        </InfoBox>
      </div>
    </div>
  );
}
