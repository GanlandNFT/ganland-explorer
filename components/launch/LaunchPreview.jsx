'use client';

import { LICENSE_DESCRIPTIONS } from '@/lib/contracts/addresses';

/**
 * LaunchPreview - Review page before deployment
 * 
 * Flow:
 * 1. User reviews collection info
 * 2. If wrong chain, prompt to switch to Optimism
 * 3. Clicks "Deploy Contract"
 * 4. DeploymentModal handles transaction + IPFS upload + success
 */
export function LaunchPreview({ 
  uploadedData, 
  config, 
  platformFee, 
  onLaunch, 
  onBack,
  isLoading,
  wrongChain,
  onSwitchChain,
  isSwitching,
  walletAddress,
  balanceFormatted,
  hasEnoughBalance,
  balanceLoading,
}) {
  const tokenTypeLabel = config.tokenType === 0 ? 'ERC-721' : 'ERC-1155';
  const licenseLabel = Object.keys(LICENSE_DESCRIPTIONS).find(
    key => LICENSE_DESCRIPTIONS[key] === LICENSE_DESCRIPTIONS[config.licenseVersion]
  ) || 'COMMERCIAL';

  const handleDeploy = () => {
    onLaunch(uploadedData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
        <p className="text-gray-400">
          Double-check everything before deploying your collection
        </p>
      </div>

      {/* Collection Summary */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          {/* Collection Avatar */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-700 rounded-full overflow-hidden flex-shrink-0 mx-auto sm:mx-0 ring-4 ring-cyan-500/30">
            {config.avatarPreview ? (
              <img 
                src={config.avatarPreview} 
                alt={config.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-cyan-600 to-purple-600">
                🎨
              </div>
            )}
          </div>

          {/* Collection Info */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold">{config.name || 'Unnamed Collection'}</h3>
            <p className="text-gray-400">{config.symbol || 'SYM'} • {tokenTypeLabel}</p>
            {config.description && (
              <p className="text-gray-300 mt-2 line-clamp-2 text-sm sm:text-base">{config.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailCard label="Max Supply" value={config.maxSupply?.toLocaleString() || '∞'} />
        <DetailCard label="Royalty" value={`${(config.royaltyFee || 0) / 100}%`} />
        <DetailCard label="License" value={licenseLabel.replace(/_/g, ' ')} />
        <DetailCard label="Token Standard" value={tokenTypeLabel} />
        <DetailCard 
          label="Files Ready" 
          value={`${uploadedData?.totalFiles || uploadedData?.stagedFiles?.length || 0} items`} 
        />
        <DetailCard 
          label="IPFS" 
          value="📌 Auto-pin on deploy" 
        />
      </div>

      {/* Info: IPFS upload is automatic */}
      <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📤</span>
          <div>
            <h4 className="font-medium text-purple-300 mb-1">Automatic IPFS Pinning</h4>
            <p className="text-gray-400 text-sm">
              Your {uploadedData?.stagedFiles?.length || uploadedData?.totalFiles || 0} files will be 
              automatically pinned to IPFS after successful payment. No manual upload required!
            </p>
          </div>
        </div>
      </div>

      {/* Cost Summary with Wallet Info */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-6 border border-cyan-700/30 space-y-4">
        {/* Wallet Address */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">👛</span>
            <span className="text-gray-400 text-sm">Connected Wallet</span>
          </div>
          <div className="font-mono text-cyan-400 text-sm">
            {walletAddress 
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'Not connected'
            }
          </div>
        </div>

        {/* Balance */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span className="text-gray-400 text-sm">Your Balance (Optimism)</span>
          </div>
          <div className={`font-mono text-sm ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
            {balanceLoading ? (
              <span className="text-gray-500">Loading...</span>
            ) : (
              `${parseFloat(balanceFormatted || '0').toFixed(4)} ETH`
            )}
          </div>
        </div>

        {/* Platform Fee */}
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium">Platform Fee</h4>
            <p className="text-gray-400 text-sm">One-time deployment fee</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {platformFee === '0' ? 'FREE' : `${platformFee} ETH`}
            </div>
            {platformFee === '0' && (
              <p className="text-green-400 text-sm">Authorized Creator</p>
            )}
          </div>
        </div>

        {/* Insufficient Balance Warning */}
        {!hasEnoughBalance && platformFee !== '0' && (
          <div className="bg-red-900/30 rounded-lg p-3 flex items-center gap-2">
            <span className="text-red-400">⚠️</span>
            <p className="text-red-400 text-sm">
              Insufficient balance. You need at least {platformFee} ETH on Optimism to deploy.
            </p>
          </div>
        )}
      </div>

      {/* Wrong Chain Warning */}
      {wrongChain && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⛓️</span>
            <div className="flex-1">
              <h4 className="font-medium text-red-400 mb-1">Wrong Network</h4>
              <p className="text-gray-400 text-sm mb-3">
                You're connected to the wrong network. Please switch to <strong className="text-white">Optimism</strong> to deploy your collection.
              </p>
              <button
                onClick={onSwitchChain}
                disabled={isSwitching}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition disabled:opacity-50"
              >
                {isSwitching ? 'Switching...' : '🔄 Switch to Optimism'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 text-yellow-400 text-sm">
        <strong>⚠️ Important:</strong> Once deployed, collection settings cannot be changed. 
        Make sure all details are correct before proceeding.
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading || isSwitching}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={handleDeploy}
          disabled={isLoading || wrongChain || isSwitching || (!hasEnoughBalance && platformFee !== '0')}
          className={`px-8 py-3 rounded-lg font-medium transition disabled:opacity-50 ${
            wrongChain || (!hasEnoughBalance && platformFee !== '0')
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500'
          }`}
        >
          {wrongChain ? '⛓️ Switch Network First' : 
           (!hasEnoughBalance && platformFee !== '0') ? '💰 Insufficient Balance' :
           '🚀 Deploy Contract'}
        </button>
      </div>
    </div>
  );
}

function DetailCard({ label, value, mono = false, truncate = false }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className={`font-medium mt-1 ${mono ? 'font-mono text-sm' : ''} ${truncate ? 'truncate' : ''}`}>
        {value}
      </p>
    </div>
  );
}

export default LaunchPreview;
