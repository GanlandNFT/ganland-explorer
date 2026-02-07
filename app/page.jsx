'use client';

import { usePrivy } from '@privy-io/react-auth';
import FeaturedCollection from '../components/FeaturedCollection';
import CollectionsGrid from '../components/CollectionsGrid';
import ArtGallery from '../components/ArtGallery';

export default function Home() {
  const { ready, authenticated, user } = usePrivy();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="text-gan-yellow neon-glow">GANLAND</span> Explorer
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          AI-powered NFT ecosystem explorer. Connect your wallet to view your portfolio across Base, Optimism, and the Superchain.
        </p>
      </section>

      {/* Featured GANLAND 222 Collection */}
      <FeaturedCollection />

      {/* NFT Collections Section */}
      <section id="collections">
        <h2 className="text-2xl font-bold mb-6 text-gan-yellow">NFT Collections</h2>
        <CollectionsGrid />
      </section>

      {/* Art Gallery Section */}
      <section id="gallery">
        <h2 className="text-2xl font-bold mb-6 text-gan-yellow">Art Gallery</h2>
        <p className="text-gray-400 mb-6">Generated art from the GAN AI agent. Mint coming soon!</p>
        <ArtGallery />
      </section>

      {/* Wallet Portfolio (if connected) */}
      {authenticated && user?.wallet && (
        <section id="portfolio">
          <h2 className="text-2xl font-bold mb-6 text-gan-yellow">Your Portfolio</h2>
          <div className="bg-gray-900 rounded-lg p-6">
            <p className="text-gray-400">
              Connected: <span className="text-white">{user.wallet.address}</span>
            </p>
            <p className="text-gray-500 mt-2">Portfolio data coming soon via Zapper API</p>
          </div>
        </section>
      )}
    </div>
  );
}
