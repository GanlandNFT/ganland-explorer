'use client';

import { LICENSE_DESCRIPTIONS } from '@/lib/contracts/addresses';

export function LaunchPreview({ 
  uploadedData, 
  config, 
  platformFee, 
  onLaunch, 
  onBack,
  isLoading 
}) {
  const tokenTypeLabel = config.tokenType === 0 ? 'ERC-721' : 'ERC-1155';
  const licenseLabel = Object.keys(LICENSE_DESCRIPTIONS).find(
    key => LICENSE_DESCRIPTIONS[key] === LICENSE_DESCRIPTIONS[config.licenseVersion]
  ) || 'COMMERCIAL';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
        <p className="text-gray-400">
          Double-check everything before deploying your collection
        </p>
      </div>

      {/* Collection Summary */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex gap-6">
          {/* Preview Image */}
          <div className="w-32 h-32 bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
            {uploadedData?.files?.[0] && (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🎨
              </div>
            )}
          </div>

          {/* Collection Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold">{config.name}</h3>
            <p className="text-gray-400">{config.symbol} • {tokenTypeLabel}</p>
            {config.description && (
              <p className="text-gray-300 mt-2 line-clamp-2">{config.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailCard label="Max Supply" value={config.maxSupply.toLocaleString()} />
        <DetailCard label="Royalty" value={`${config.royaltyFee / 100}%`} />
        <DetailCard label="License" value={licenseLabel.replace(/_/g, ' ')} />
        <DetailCard label="Token Standard" value={tokenTypeLabel} />
        <DetailCard 
          label="Base URI" 
          value={uploadedData?.baseURI || 'N/A'} 
          mono 
          truncate 
        />
        <DetailCard 
          label="Files Uploaded" 
          value={`${uploadedData?.totalFiles || 0} items`} 
        />
      </div>

      {/* IPFS Info */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <h4 className="font-medium mb-3">IPFS Details</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Images CID</span>
            <span className="font-mono text-cyan-400">
              {uploadedData?.imagesHash ? `${uploadedData.imagesHash.slice(0, 20)}...` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Metadata CID</span>
            <span className="font-mono text-cyan-400">
              {uploadedData?.metadataHash ? `${uploadedData.metadataHash.slice(0, 20)}...` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-6 border border-cyan-700/30">
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
      </div>

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
          disabled={isLoading}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={onLaunch}
          disabled={isLoading}
          className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Deploying...
            </span>
          ) : (
            '🚀 Deploy Collection'
          )}
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
