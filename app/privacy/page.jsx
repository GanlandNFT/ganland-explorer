'use client';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gan-yellow mb-8">Privacy Policy</h1>
      
      <div className="prose prose-invert prose-yellow">
        <p className="text-gray-300 mb-6">
          <strong>Last Updated:</strong> February 7, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
          <p className="text-gray-300">
            GANLAND ("we", "us", "our") respects your privacy. This Privacy Policy explains how we collect, 
            use, and protect your information when you use our AI-powered generative art platform and 
            blockchain services on the Superchain.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
          
          <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">Blockchain Data</h3>
          <p className="text-gray-300">
            Public blockchain transactions are inherently transparent. When you interact with GANLAND smart contracts, 
            your wallet address and transaction history are publicly visible on the blockchain.
          </p>

          <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">Account Information</h3>
          <p className="text-gray-300">When you connect via Privy or social login, we may receive:</p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>Twitter/X username and profile information</li>
            <li>Email address (if provided)</li>
            <li>Wallet addresses you connect</li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">Usage Data</h3>
          <p className="text-gray-300">
            We collect anonymous usage statistics to improve our services, including page views, 
            feature usage, and error reports.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>Process NFT minting and token transfers</li>
            <li>Generate AI art based on your prompts</li>
            <li>Link your wallet to your social identity (with your consent)</li>
            <li>Communicate service updates and announcements</li>
            <li>Improve and optimize the Platform</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">4. Data Storage & Security</h2>
          <p className="text-gray-300">
            We use industry-standard security measures to protect your data. However, no system is 100% secure. 
            We store data using:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li><strong>Supabase:</strong> Encrypted database for user profiles</li>
            <li><strong>IPFS/Pinata:</strong> Decentralized storage for NFT metadata</li>
            <li><strong>Privy:</strong> Secure wallet and authentication management</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">5. Third-Party Services</h2>
          <p className="text-gray-300">We integrate with third-party services that have their own privacy policies:</p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>Privy (authentication & wallets)</li>
            <li>Alchemy (blockchain data)</li>
            <li>Leonardo AI (image generation)</li>
            <li>Twitter/X (social login)</li>
            <li>Vercel (hosting)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">6. Your Rights</h2>
          <p className="text-gray-300">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>Access your personal data we hold</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account (note: blockchain data cannot be deleted)</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">7. Cookies & Tracking</h2>
          <p className="text-gray-300">
            We use essential cookies for authentication and session management. 
            We do not use invasive tracking or sell your data to advertisers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">8. Children's Privacy</h2>
          <p className="text-gray-300">
            GANLAND is not intended for users under 18. We do not knowingly collect data from minors.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update this Privacy Policy periodically. Continued use of the Platform after changes 
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">10. Contact</h2>
          <p className="text-gray-300">
            For privacy inquiries, contact us via{' '}
            <a href="https://x.com/GanlandNFT" className="text-gan-yellow hover:underline">@GanlandNFT</a>
            {' '}or{' '}
            <a href="https://x.com/Fractal_Visions" className="text-gan-yellow hover:underline">@Fractal_Visions</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
