'use client';

import { useState } from 'react';
import { LICENSE_DESCRIPTIONS } from '@/lib/contracts/addresses';
import { PinataClient } from '@/lib/pinata';

export function LaunchPreview({ 
  uploadedData, 
  config, 
  platformFee, 
  onLaunch, 
  onBack,
  isLoading,
  walletAddress,
}) {
  const [ipfsStatus, setIpfsStatus] = useState('pending'); // pending, uploading, complete, error
  const [ipfsProgress, setIpfsProgress] = useState(0);
  const [ipfsResult, setIpfsResult] = useState(null);
  const [ipfsError, setIpfsError] = useState(null);

  const tokenTypeLabel = config.tokenType === 0 ? 'ERC-721' : 'ERC-1155';
  const licenseLabel = Object.keys(LICENSE_DESCRIPTIONS).find(
    key => LICENSE_DESCRIPTIONS[key] === LICENSE_DESCRIPTIONS[config.licenseVersion]
  ) || 'COMMERCIAL';

  const isPendingIpfs = uploadedData?.ipfsPending && ipfsStatus === 'pending';
  const hasIpfsResult = ipfsStatus === 'complete' || !uploadedData?.ipfsPending;

  // Upload to IPFS when user confirms
  const handleIpfsUpload = async () => {
    if (!uploadedData?.stagedFiles?.length) {
      setIpfsError('No files to upload');
      return;
    }

    setIpfsStatus('uploading');
    setIpfsProgress(0);
    setIpfsError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        throw new Error('Pinata API keys not configured');
      }

      const pinata = new PinataClient(apiKey, secretKey);
      const files = uploadedData.stagedFiles;
      const collectionName = config.name?.replace(/[^a-zA-Z0-9]/g, '-') || `collection-${Date.now()}`;

      setIpfsProgress(10);

      let result;
      if (uploadedData.uploadMode === 'full' && uploadedData.stagedMetadata?.length > 0) {
        // User provided custom metadata
        const imagesResult = await pinata.uploadFolder(files, `${collectionName}-images`);
        setIpfsProgress(50);
        
        const metadataResult = await pinata.uploadFolder(uploadedData.stagedMetadata, `${collectionName}-metadata`);
        setIpfsProgress(90);

        result = {
          imagesHash: imagesResult.ipfsHash,
          metadataHash: metadataResult.ipfsHash,
          baseURI: `ipfs://${metadataResult.ipfsHash}/${collectionName}-metadata/`,
          totalFiles: files.length,
        };
      } else {
        // Auto-generate metadata
        result = await pinata.bulkUploadCollection({
          imageFiles: files,
          collectionName,
          description: config.description || '',
        });
        setIpfsProgress(90);
      }

      // Track the pin in Supabase
      if (walletAddress) {
        try {
          await fetch('/api/ipfs/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: walletAddress,
              imagesCid: result.imagesHash,
              metadataCid: result.metadataHash,
              baseUri: result.baseURI,
            }),
          });
        } catch (e) {
          console.error('Failed to track pin:', e);
        }
      }

      // Delete the draft since we've uploaded
      if (walletAddress) {
        try {
          await fetch(`/api/drafts?wallet=${encodeURIComponent(walletAddress)}`, {
            method: 'DELETE',
          });
        } catch (e) {
          console.error('Failed to delete draft:', e);
        }
      }

      setIpfsProgress(100);
      setIpfsResult(result);
      setIpfsStatus('complete');

    } catch (err) {
      console.error('IPFS upload error:', err);
      setIpfsError(err.message);
      setIpfsStatus('error');
    }
  };

  // Handle deploy - only after IPFS is complete
  const handleDeploy = () => {
    const finalData = ipfsResult || uploadedData;
    onLaunch(finalData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Launch</h2>
        <p className="text-gray-400">
          {isPendingIpfs 
            ? 'Confirm IPFS upload, then deploy your collection'
            : 'Double-check everything before deploying your collection'
          }
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
          label="Files" 
          value={`${uploadedData?.totalFiles || uploadedData?.stagedFiles?.length || 0} items`} 
        />
        <DetailCard 
          label="IPFS Status" 
          value={
            ipfsStatus === 'pending' ? '⏳ Pending Upload' :
            ipfsStatus === 'uploading' ? `⬆️ ${ipfsProgress}%` :
            ipfsStatus === 'complete' ? '✅ Uploaded' :
            ipfsStatus === 'error' ? '❌ Error' :
            '✅ Ready'
          }
        />
      </div>

      {/* IPFS Upload Section - Show if files are staged but not uploaded */}
      {isPendingIpfs && (
        <div className="bg-purple-900/30 rounded-xl p-6 border border-purple-700/50">
          <div className="flex items-start gap-4">
            <span className="text-3xl">📤</span>
            <div className="flex-1">
              <h4 className="font-bold text-purple-300 mb-1">Step 1: Upload to IPFS</h4>
              <p className="text-gray-400 text-sm mb-4">
                Your {uploadedData?.stagedFiles?.length || 0} files are staged locally. 
                Click below to pin them to IPFS via Pinata before deployment.
              </p>
              <button
                onClick={handleIpfsUpload}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition"
              >
                📌 Upload to IPFS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IPFS Uploading Progress */}
      {ipfsStatus === 'uploading' && (
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <span className="font-medium">Uploading to IPFS...</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
              style={{ width: `${ipfsProgress}%` }}
            />
          </div>
          <p className="text-center text-gray-400 text-sm mt-2">{ipfsProgress}% complete</p>
        </div>
      )}

      {/* IPFS Error */}
      {ipfsStatus === 'error' && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400">
          <strong>❌ Upload Failed:</strong> {ipfsError}
          <button
            onClick={() => setIpfsStatus('pending')}
            className="ml-4 text-sm underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* IPFS Complete - Show CIDs */}
      {hasIpfsResult && (ipfsResult || uploadedData?.imagesHash) && (
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span className="text-green-400">✓</span> IPFS Details
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Images CID</span>
              <a 
                href={`https://gateway.pinata.cloud/ipfs/${ipfsResult?.imagesHash || uploadedData?.imagesHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-cyan-400 hover:underline truncate max-w-[200px]"
              >
                {(ipfsResult?.imagesHash || uploadedData?.imagesHash)?.slice(0, 20)}...
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Metadata CID</span>
              <a 
                href={`https://gateway.pinata.cloud/ipfs/${ipfsResult?.metadataHash || uploadedData?.metadataHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-cyan-400 hover:underline truncate max-w-[200px]"
              >
                {(ipfsResult?.metadataHash || uploadedData?.metadataHash)?.slice(0, 20)}...
              </a>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Base URI</span>
              <span className="font-mono text-gray-300 truncate max-w-[200px]">
                {ipfsResult?.baseURI || uploadedData?.baseURI || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

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
          disabled={isLoading || ipfsStatus === 'uploading'}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={handleDeploy}
          disabled={isLoading || !hasIpfsResult || ipfsStatus === 'uploading'}
          className={`px-8 py-3 rounded-lg font-medium transition ${
            hasIpfsResult && !isLoading
              ? 'bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Deploying...
            </span>
          ) : !hasIpfsResult ? (
            'Upload to IPFS First ↑'
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
