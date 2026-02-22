import { CommandRow, DocsSection, InfoBox } from '../../../components/DocsLayout';

export const metadata = {
  title: 'Art Generation | GANLAND Docs',
  description: 'Create AI-generated art with $GAN tokens',
};

export default function ArtDocsPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-gray-400 text-lg">
          Generate unique AI artwork using natural language prompts. Powered by Leonardo AI and paid with $GAN tokens.
        </p>
      </div>

      <DocsSection 
        title="Generate Art" 
        icon="🎨"
        description="Create AI art from text prompts"
      >
        <CommandRow 
          command="@GanlandNFT generate [your prompt]"
          description="Generate AI art from your text description. Be descriptive for best results."
          example="@GanlandNFT generate a cosmic fractal eye emerging from digital chaos"
        />
        <CommandRow 
          command="@GanlandNFT [your prompt]"
          description="You can also just describe what you want without 'generate'"
          example="@GanlandNFT cyberpunk lobster in neon city"
        />
        
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
          <h4 className="font-bold text-green-400 mb-2">Response:</h4>
          <div className="text-gray-400 text-sm space-y-2">
            <p>🎨 Creating your art...</p>
            <p className="text-gray-500 italic">(followed by image reply)</p>
            <p>Here's your creation! 👁️</p>
            <p>Prompt: "a cosmic fractal eye emerging from digital chaos"</p>
          </div>
        </div>
      </DocsSection>

      <DocsSection 
        title="Style Presets" 
        icon="🎭"
        description="Use style keywords for specific aesthetics"
      >
        <CommandRow 
          command="@GanlandNFT generate cyberpunk [prompt]"
          description="Cyberpunk aesthetic with neon colors and futuristic elements"
          example="@GanlandNFT generate cyberpunk city at sunset with neon lights"
        />
        <CommandRow 
          command="@GanlandNFT generate fractal [prompt]"
          description="Fractal and mathematical patterns"
          example="@GanlandNFT generate fractal spiral emerging from the void"
        />
        <CommandRow 
          command="@GanlandNFT generate ethereal [prompt]"
          description="Dreamy, mystical aesthetic"
          example="@GanlandNFT generate ethereal forest spirit"
        />
        <CommandRow 
          command="@GanlandNFT generate cosmic [prompt]"
          description="Space and cosmic themes"
          example="@GanlandNFT generate cosmic nebula forming a dragon"
        />
      </DocsSection>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">💰 Pricing</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-gan-yellow/20 to-transparent border border-gan-yellow/30 rounded-xl">
            <div className="text-3xl font-bold text-gan-yellow">500,000 $GAN</div>
            <div className="text-gray-400 mt-2">Per generation</div>
            <div className="text-sm text-gray-500 mt-1">≈ $0.12 USD at current prices</div>
          </div>
          <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
            <div className="text-sm text-gray-500 mb-2">Dynamic pricing adjusts with token price</div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• &lt; $0.0000005 → 500,000 $GAN</p>
              <p>• $0.000001 → 125,000 $GAN</p>
              <p>• $0.00001 → 2,500 $GAN</p>
              <p>• &gt; $0.0001 → 100 $GAN (min)</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">🆓 Featured Artists (Free Tier)</h2>
        <p className="text-gray-400 mb-4">
          Featured artists on Fractal Visions receive <strong className="text-green-400">free generations</strong>.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h4 className="font-bold mb-2">Current Featured Artists</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• @IGLIVISION (IGLI)</li>
              <li>• @artfractalicia (Fractalicia)</li>
              <li>• @fractal_visions (Fractal Visions)</li>
              <li>• @GanlandNFT (GAN)</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h4 className="font-bold mb-2">Benefits</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>✅ Unlimited free art generations</li>
              <li>✅ Share of 5% Artist Fund</li>
              <li>✅ Exposure on @GanlandNFT</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Want to join? Contact <a href="https://x.com/IGLIVISION" className="text-gan-yellow hover:underline">@IGLIVISION</a> or <a href="https://x.com/artfractalicia" className="text-gan-yellow hover:underline">@artfractalicia</a>
        </p>
      </section>

      <InfoBox type="tip" title="Generation Tips">
        <ul className="space-y-1">
          <li>• <strong>Be descriptive</strong> — more details = better results</li>
          <li>• Mention <strong>colors, moods, and styles</strong> you want</li>
          <li>• Generated art appears as a <strong>reply to your tweet</strong></li>
          <li>• You can <strong>mint your creations as NFTs</strong> (coming soon)</li>
        </ul>
      </InfoBox>

      <section className="mt-12">
        <h2 className="text-xl font-bold mb-4">🛠️ Technical Details</h2>
        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Model</span>
            <span>Leonardo Diffusion XL</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Resolution</span>
            <span>1024 × 1024</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Delivery</span>
            <span>Reply to tweet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Storage</span>
            <span>IPFS via Pinata</span>
          </div>
        </div>
      </section>

      <div className="mt-8 p-6 bg-gradient-to-r from-gan-yellow/10 to-purple-500/10 border border-gan-yellow/30 rounded-xl">
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
    </div>
  );
}
