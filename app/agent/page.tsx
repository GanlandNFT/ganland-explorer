'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AgentCreationForm from '@/components/AgentCreationForm'

export default function AgentDashboard() {
  const { authenticated, logout } = usePrivy()
  const { wallets } = useWallets()
  const router = useRouter()
  const [step, setStep] = useState<'intro' | 'create' | 'mission-control'>('intro')

  if (!authenticated) {
    router.push('/')
    return null
  }

  const userWallet = wallets[0]?.address

  return (
    <div className="min-h-screen bg-gradient-to-br from-gan-black via-gray-900 to-gan-black">
      {/* Header */}
      <header className="border-b border-gan-gold/20 bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black bg-gradient-to-r from-gan-gold to-gan-cyan bg-clip-text text-transparent">
            👁️ GAN Agent Launchpad
          </h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-gray-300 hover:text-gan-gold transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {step === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Welcome Card */}
            <div className="p-8 rounded-xl bg-white/5 border border-gan-gold/20">
              <h2 className="text-3xl font-bold mb-4">Welcome to Mission Control</h2>
              <p className="text-gray-300 mb-6">
                You're one step away from launching your AI agent as a dynamic NFT on Optimism.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-gan-gold font-bold">1️⃣</span>
                  <div>
                    <h3 className="font-bold">Create Agent</h3>
                    <p className="text-sm text-gray-400">Name, avatar, and GitHub sync</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gan-gold font-bold">2️⃣</span>
                  <div>
                    <h3 className="font-bold">Deploy NFT</h3>
                    <p className="text-sm text-gray-400">721 contract on Optimism</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gan-gold font-bold">3️⃣</span>
                  <div>
                    <h3 className="font-bold">Launch Moltworker</h3>
                    <p className="text-sm text-gray-400">Always-on agent on Cloudflare</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-gan-gold font-bold">4️⃣</span>
                  <div>
                    <h3 className="font-bold">Manage & Earn</h3>
                    <p className="text-sm text-gray-400">Deploy tokens, earn fees</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-6 rounded-xl bg-gradient-to-br from-gan-gold/10 to-gan-cyan/10 border border-gan-gold/20"
              >
                <p className="text-sm text-gray-400 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm break-all">{userWallet}</p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep('create')}
                className="w-full p-4 bg-gradient-to-r from-gan-gold to-gan-cyan text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gan-gold/50 transition-all"
              >
                🚀 Launch Agent
              </motion.button>

              <div className="p-6 rounded-xl bg-white/5 border border-gan-gold/20">
                <h3 className="font-bold mb-3">Deployed Agents</h3>
                <p className="text-gray-400 text-sm">None yet. Create your first one!</p>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'create' && (
          <AgentCreationForm
            onSuccess={() => setStep('mission-control')}
            onBack={() => setStep('intro')}
          />
        )}
      </main>
    </div>
  )
}
