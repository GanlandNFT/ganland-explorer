'use client';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gan-yellow mb-8">Terms of Service</h1>
      
      <div className="prose prose-invert prose-yellow">
        <p className="text-gray-300 mb-6">
          <strong>Last Updated:</strong> February 7, 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-300">
            By accessing or using GANLAND ("the Platform"), you agree to be bound by these Terms of Service. 
            GANLAND is operated by Fractal Visions and provides AI-powered generative art services, 
            NFT minting, and blockchain wallet functionality on the Superchain (Base, Optimism, and related networks).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">2. HD Wallet Services</h2>
          <p className="text-gray-300">
            GANLAND provides hierarchical deterministic (HD) wallet services for users. By using our wallet services:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>You acknowledge that you are solely responsible for maintaining the security of your wallet</li>
            <li>Private keys are derived from a master seed; loss of access means permanent loss of funds</li>
            <li>We do not have access to your private keys and cannot recover lost wallets</li>
            <li>You agree to keep your wallet credentials secure and confidential</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">3. NFT Minting & Collections</h2>
          <p className="text-gray-300">
            When minting NFTs through GANLAND:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>All transactions are final and recorded on the blockchain</li>
            <li>Gas fees and minting costs are non-refundable</li>
            <li>NFT metadata and images are stored on IPFS for permanence</li>
            <li>You retain ownership of NFTs you mint or purchase</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">4. AI Art Generation</h2>
          <p className="text-gray-300">
            Our AI art generation service (powered by Leonardo AI) creates unique digital artwork. 
            Generated images are owned by the requester upon successful payment. 
            We reserve the right to refuse generation requests that violate our content policies.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">5. $VISION & $GAN Tokens</h2>
          <p className="text-gray-300">
            GANLAND utilizes utility tokens on the Base and Optimism networks. 
            These tokens are not investment vehicles and have no guaranteed value. 
            Token transactions are subject to network fees and blockchain confirmation times.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">6. Prohibited Activities</h2>
          <p className="text-gray-300">You agree not to:</p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>Use the Platform for illegal activities</li>
            <li>Attempt to manipulate or exploit smart contracts</li>
            <li>Create or distribute harmful, offensive, or infringing content</li>
            <li>Impersonate others or misrepresent your identity</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-300">
            GANLAND is provided "as is" without warranties. We are not liable for:
          </p>
          <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
            <li>Loss of funds due to user error or compromised credentials</li>
            <li>Smart contract bugs or blockchain network issues</li>
            <li>Market value fluctuations of tokens or NFTs</li>
            <li>Third-party service interruptions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">8. Contact</h2>
          <p className="text-gray-300">
            For questions about these terms, contact us via{' '}
            <a href="https://x.com/GanlandNFT" className="text-gan-yellow hover:underline">@GanlandNFT</a>
            {' '}or{' '}
            <a href="https://x.com/Fractal_Visions" className="text-gan-yellow hover:underline">@Fractal_Visions</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
