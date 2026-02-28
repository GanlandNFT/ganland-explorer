'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PinataClient } from '@/lib/pinata';
import { Checkmark3D } from '@/components/icons/Checkmark3D';

/**
 * DeploymentModal - Handles the entire deployment flow:
 * 1. Transaction initiated → show processing + tx link
 * 2. Payment confirmed → auto-pin to IPFS
 * 3. IPFS complete → confetti + success message
 */
export function DeploymentModal({
  isOpen,
  onClose,
  config,
  uploadedData,
  walletAddress,
  hash,
  isLoading,
  isSuccess,
  error,
  onComplete,
}) {
  const [stage, setStage] = useState('transaction'); // transaction, ipfs, success, error
  const [ipfsProgress, setIpfsProgress] = useState(0);
  const [ipfsResult, setIpfsResult] = useState(null);
  const [ipfsError, setIpfsError] = useState(null);

  // Fire confetti when reaching success stage
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#22d3ee', '#a855f7', '#10b981', '#f59e0b'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#22d3ee', '#a855f7', '#10b981', '#f59e0b'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  // Handle IPFS upload after transaction success
  const uploadToIpfs = useCallback(async () => {
    if (!uploadedData?.stagedFiles?.length) {
      // Files might already be on IPFS
      if (uploadedData?.imagesHash) {
        setIpfsResult({
          imagesHash: uploadedData.imagesHash,
          metadataHash: uploadedData.metadataHash,
          baseURI: uploadedData.baseURI,
        });
        setStage('success');
        fireConfetti();
        return;
      }
      setIpfsError('No files to upload');
      setStage('error');
      return;
    }

    setStage('ipfs');
    setIpfsProgress(0);

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
              txHash: hash,
            }),
          });
        } catch (e) {
          console.error('Failed to track pin:', e);
        }
      }

      // Delete the draft since deployment is complete
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
      setStage('success');
      fireConfetti();

      // Notify parent of complete data
      if (onComplete) {
        onComplete({
          ...result,
          txHash: hash,
        });
      }
    } catch (err) {
      console.error('IPFS upload error:', err);
      setIpfsError(err.message);
      setStage('error');
    }
  }, [uploadedData, config, walletAddress, hash, fireConfetti, onComplete]);

  // Watch for transaction success to trigger IPFS upload
  useEffect(() => {
    if (isSuccess && stage === 'transaction') {
      uploadToIpfs();
    }
  }, [isSuccess, stage, uploadToIpfs]);

  // Watch for errors
  useEffect(() => {
    if (error) {
      setStage('error');
    }
  }, [error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative border border-gray-700 shadow-2xl">
        
        {/* Transaction Stage */}
        {stage === 'transaction' && (
          <div className="text-center">
            <div className="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Deploying Contract...</h2>
            <p className="text-gray-400 mb-4">
              {isLoading 
                ? 'Please confirm the transaction in your wallet'
                : 'Waiting for confirmation...'}
            </p>
            
            {hash && (
              <a
                href={`https://optimistic.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-cyan-400 text-sm transition"
              >
                <span>View Transaction</span>
                <span>↗</span>
              </a>
            )}
          </div>
        )}

        {/* IPFS Upload Stage */}
        {stage === 'ipfs' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 animate-ping bg-purple-500/30 rounded-full" />
              <div className="relative w-full h-full flex items-center justify-center text-4xl">
                📌
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Pinning to IPFS...</h2>
            <p className="text-gray-400 mb-6">Your artwork is being permanently stored</p>
            
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                style={{ width: `${ipfsProgress}%` }}
              />
            </div>
            <p className="text-gray-500 text-sm">{ipfsProgress}% complete</p>
            
            {hash && (
              <a
                href={`https://optimistic.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-cyan-400 text-sm hover:underline"
              >
                Transaction confirmed ✓
              </a>
            )}
          </div>
        )}

        {/* Success Stage */}
        {stage === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Checkmark3D size={96} />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-green-400">Successful Deployment!</h2>
            <p className="text-gray-400 mb-6">Your NFT collection is now live on <span className="text-red-400 font-medium">Optimism</span></p>

            {/* Links */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left space-y-3">
              {hash && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Transaction</span>
                  <a
                    href={`https://optimistic.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline text-sm truncate max-w-[180px]"
                  >
                    {hash.slice(0, 10)}...{hash.slice(-8)} ↗
                  </a>
                </div>
              )}
              {ipfsResult?.imagesHash && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Images (IPFS)</span>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${ipfsResult.imagesHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline text-sm truncate max-w-[180px]"
                  >
                    {ipfsResult.imagesHash.slice(0, 12)}... ↗
                  </a>
                </div>
              )}
              {ipfsResult?.metadataHash && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Metadata (IPFS)</span>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${ipfsResult.metadataHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline text-sm truncate max-w-[180px]"
                  >
                    {ipfsResult.metadataHash.slice(0, 12)}... ↗
                  </a>
                </div>
              )}
            </div>

            {/* Listing CTA */}
            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-4 border border-cyan-700/30 mb-6">
              <p className="text-sm text-gray-300 mb-3">
                🎨 Want your collection listed on <strong>Fractal Visions</strong> marketplace?
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="https://x.com/ganlandnft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                >
                  Contact @ganlandnft
                </a>
                <a
                  href="https://x.com/fractal_visions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                >
                  Contact @fractal_visions
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Visit <a href="https://fractalvisions.io" className="text-cyan-400 hover:underline">fractalvisions.io</a> 🍄🎨
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-lg font-medium transition"
            >
              Done
            </button>
          </div>
        )}

        {/* Error Stage */}
        {stage === 'error' && (
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2 text-red-400">Deployment Failed</h2>
            <p className="text-gray-400 mb-6">{error || ipfsError || 'Something went wrong'}</p>
            
            {hash && (
              <a
                href={`https://optimistic.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline text-sm mb-4 block"
              >
                View Transaction ↗
              </a>
            )}
            
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeploymentModal;
