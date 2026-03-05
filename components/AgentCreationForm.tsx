'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallets } from '@privy-io/react-auth'

interface AgentCreationFormProps {
  onSuccess: () => void
  onBack: () => void
}

export default function AgentCreationForm({ onSuccess, onBack }: AgentCreationFormProps) {
  const { wallets } = useWallets()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    avatar: null as File | null,
    githubRepo: '',
    githubAuth: false,
  })
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData(prev => ({ ...prev, avatar: e.target.files![0] }))
    }
  }

  const handleGitHubAuth = async () => {
    setLoading(true)
    try {
      // GitHub OAuth flow
      // TODO: Implement @octokit/auth-app flow
      setFormData(prev => ({ ...prev, githubAuth: true }))
      setStep(3)
    } catch (error) {
      console.error('GitHub auth failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploy = async () => {
    setLoading(true)
    try {
      // Call /api/deploy-agent
      const response = await fetch('/api/deploy-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          walletAddress: wallets[0]?.address,
        }),
      })

      if (!response.ok) throw new Error('Deploy failed')
      setStep(4)
      onSuccess()
    } catch (error) {
      console.error('Deploy failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8 flex justify-between">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex-1">
            <div
              className={`h-1 ${
                s <= step ? 'bg-gradient-to-r from-gan-gold to-gan-cyan' : 'bg-white/10'
              } transition-all`}
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              {['Agent Info', 'GitHub', 'Review', 'Deploy'][s - 1]}
            </p>
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-8 rounded-xl bg-white/5 border border-gan-gold/20"
      >
        {/* Step 1: Agent Info */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Create Your Agent</h2>

            <div>
              <label className="block text-sm font-bold mb-2">Agent Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Neural Genesis"
                className="w-full px-4 py-2 bg-black border border-gan-gold/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gan-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="What does your agent do?"
                rows={4}
                className="w-full px-4 py-2 bg-black border border-gan-gold/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gan-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Avatar Image</label>
              <div className="border-2 border-dashed border-gan-gold/30 rounded-lg p-6 text-center cursor-pointer hover:border-gan-gold transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="avatar"
                />
                <label htmlFor="avatar" className="cursor-pointer">
                  {formData.avatar ? (
                    <div>
                      <p className="font-bold text-gan-gold">{formData.avatar.name}</p>
                      <p className="text-sm text-gray-400">Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold mb-1">📤 Drop image or click</p>
                      <p className="text-sm text-gray-400">PNG, JPG, GIF (max 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={onBack}
                className="flex-1 px-4 py-2 border border-gray-500 rounded-lg hover:border-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.name}
                className="flex-1 px-4 py-2 bg-gan-gold text-black font-bold rounded-lg disabled:opacity-50 hover:shadow-lg hover:shadow-gan-gold/50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: GitHub */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Connect GitHub (Optional)</h2>

            <div className="p-4 rounded-lg bg-gan-gold/10 border border-gan-gold/30">
              <p className="text-sm">
                Sync your agent SOUL (personality config) from a GitHub repo. Allows automated agent updates.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">GitHub Repo URL</label>
              <input
                type="text"
                name="githubRepo"
                value={formData.githubRepo}
                onChange={handleInputChange}
                placeholder="https://github.com/user/repo"
                className="w-full px-4 py-2 bg-black border border-gan-gold/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gan-gold"
              />
            </div>

            {!formData.githubAuth && (
              <button
                onClick={handleGitHubAuth}
                disabled={loading}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Authorizing...' : 'Authorize with GitHub'}
              </button>
            )}

            {formData.githubAuth && (
              <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/50 text-green-300">
                ✓ GitHub authorized
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-500 rounded-lg hover:border-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 bg-gan-gold text-black font-bold rounded-lg hover:shadow-lg hover:shadow-gan-gold/50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Review & Deploy</h2>

            <div className="space-y-4 p-4 rounded-lg bg-black border border-gan-gold/20">
              <div>
                <p className="text-sm text-gray-400">Agent Name</p>
                <p className="font-bold">{formData.name}</p>
              </div>
              {formData.description && (
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p>{formData.description}</p>
                </div>
              )}
              {formData.githubAuth && (
                <div>
                  <p className="text-sm text-gray-400">GitHub</p>
                  <p className="font-mono text-sm">{formData.githubRepo}</p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-gan-gold/10 border border-gan-gold/30">
              <h3 className="font-bold mb-2">What happens next:</h3>
              <ol className="text-sm space-y-1 text-gray-300 list-decimal list-inside">
                <li>Upload avatar to IPFS (Pinata)</li>
                <li>Deploy ERC-721 NFT on Optimism (~$0.50)</li>
                <li>Launch Moltworker on Cloudflare</li>
                <li>Create Mission Control dashboard</li>
              </ol>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 border border-gray-500 rounded-lg hover:border-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleDeploy}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gan-gold to-gan-cyan text-black font-bold rounded-lg disabled:opacity-50 hover:shadow-lg hover:shadow-gan-gold/50 transition-all"
              >
                {loading ? '⏳ Deploying...' : '🚀 Deploy Agent'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="space-y-6 text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold">Agent Deployed!</h2>
            <p className="text-gray-300">
              Your NFT is now live on Optimism. Your Moltworker is spinning up.
            </p>
            <button
              onClick={onSuccess}
              className="w-full px-4 py-2 bg-gan-gold text-black font-bold rounded-lg hover:shadow-lg hover:shadow-gan-gold/50 transition-all"
            >
              Go to Mission Control
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
