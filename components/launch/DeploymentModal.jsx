'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PinataClient } from '@/lib/pinata';
import { Checkmark3D } from '@/components/icons/Checkmark3D';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { optimism } from 'viem/chains';
import { BrowserProvider, Contract } from 'ethers';

// NFT ABI for setBaseURI
const NFT_ABI = [
  {
    name: 'setBaseURI',
    type: 'function',
    inputs: [{ name: 'baseURI_', type: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

// Public client for reading transaction receipts
const publicClient = createPublicClient({
  chain: optimism,
  transport: http()
});

// LaunchCreated event ABI for parsing
const LAUNCH_CREATED_EVENT = {
  type: 'event',
  name: 'LaunchCreated',
  inputs: [
    { indexed: false, name: 'launchId', type: 'uint256' },
    { indexed: true, name: 'tokenType', type: 'uint8' },
    { indexed: true, name: 'tokenContract', type: 'address' },
    { indexed: true, name: 'creator', type: 'address' }
  ]
};

// Add 3D rotation keyframes
const rotateKeyframes = `
  @keyframes spin3d {
    0% { transform: rotateY(0deg); }
    50% { transform: rotateY(180deg); }
    100% { transform: rotateY(360deg); }
  }
`;



// License version labels
const LICENSE_LABELS = {
  1: 'Personal Use',
  2: 'Commercial',
  3: 'CC0 (Public Domain)',
};

// Token type labels
const TOKEN_TYPE_LABELS = {
  0: 'ERC-721',
  1: 'ERC-1155',
};

/**
 * DeploymentModal - Handles the entire deployment flow:
 * 1. Transaction initiated → show processing + tx link
 * 2. Payment confirmed → auto-pin to IPFS
 * 3. IPFS complete → confetti + success message + X share
 */
export function DeploymentModal({
  isOpen,
  onClose,
  config,        // Collection config (name, symbol, description, etc.)
  uploadedData,
  walletAddress,
  wallet,        // Privy embedded wallet for signing setBaseURI
  hash,
  isLoading,
  isSuccess,
  error,
  onComplete,
  onCancel,
}) {
  const [stage, setStage] = useState('transaction');
  const [ipfsProgress, setIpfsProgress] = useState(0);
  const [ipfsResult, setIpfsResult] = useState(null);
  const [ipfsError, setIpfsError] = useState(null);
  
  // URI update state
  const [uriUpdatePending, setUriUpdatePending] = useState(false);
  const [uriUpdateTxHash, setUriUpdateTxHash] = useState(null);
  const [uriUpdateError, setUriUpdateError] = useState(null);
  const [uriUpdated, setUriUpdated] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStage('transaction');
      setIpfsProgress(0);
      setIpfsResult(null);
      setIpfsError(null);
      setUriUpdatePending(false);
      setUriUpdateTxHash(null);
      setUriUpdateError(null);
      setUriUpdated(false);
    }
  }, [isOpen]);

  // Handle close/cancel
  const handleClose = useCallback(() => {
    if (onCancel) onCancel();
    onClose();
  }, [onCancel, onClose]);

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

  /**
   * Share on X (Twitter) with collection details
   */
  /**
   * Share on X - Opens 2 tweet windows (280 char limit for non-premium)
   */
  const shareOnX = useCallback(() => {
    const tokenType = TOKEN_TYPE_LABELS[config?.tokenType] || 'ERC-721';
    const license = LICENSE_LABELS[config?.licenseVersion] || 'Commercial';
    const royalty = config?.royaltyFee ? (config.royaltyFee / 100).toFixed(1) : '5.0';
    const totalFiles = ipfsResult?.totalFiles || uploadedData?.totalFiles || config?.maxSupply || '?';
    
    // Tweet 1: Main announcement (under 280 chars)
    const tweet1 = [
      `🎉 I just launched my NFT project on @Optimism!`,
      ``,
      `📦 ${config?.name || 'My Collection'} (${config?.symbol || 'NFT'})`,
      `⚡ ${tokenType} | 🖼️ ${config?.maxSupply || '?'} NFTs`,
      `💰 ${royalty}% royalty | 📄 ${license}`,
      ``,
      `Built with @GanlandNFT Launchpad 🚀`,
    ].join('\n');
    
    // Tweet 2: Links & details
    const tweet2 = [
      `📌 ${totalFiles} images pinned to IPFS`,
      ``,
      `🔗 View on Etherscan:`,
      `https://optimistic.etherscan.io/tx/${hash}`,
      ``,
      `Deploy your own collection at ganland.ai/launch ✨`,
    ].join('\n');
    
    // Open first tweet
    const url1 = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet1)}`;
    window.open(url1, '_blank', 'width=550,height=420');
    
    // Open second tweet after short delay
    setTimeout(() => {
      const url2 = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet2)}`;
      window.open(url2, 'tweet2', 'width=550,height=420,left=100');
    }, 500);
  }, [config, hash, ipfsResult, uploadedData]);

  // Handle IPFS upload after transaction success
  const uploadToIpfs = useCallback(async () => {
    if (!uploadedData?.stagedFiles?.length) {
      if (uploadedData?.imagesHash) {
        setIpfsResult({
          imagesHash: uploadedData.imagesHash,
          metadataHash: uploadedData.metadataHash,
          baseURI: uploadedData.baseURI,
          totalFiles: uploadedData.totalFiles,
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
        result = await pinata.bulkUploadCollection({
          imageFiles: files,
          collectionName,
          description: config.description || '',
        });
        result.totalFiles = files.length;
        setIpfsProgress(90);
      }

      // Get deployed collection address from transaction receipt
      let deployedAddress = null;
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash });
        // Find the LaunchCreated event log
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: [LAUNCH_CREATED_EVENT],
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'LaunchCreated') {
              deployedAddress = decoded.args.tokenContract;
              console.log('Deployed collection:', deployedAddress);
              break;
            }
          } catch (e) {
            // Not our event, skip
          }
        }
      } catch (e) {
        console.error('Failed to get collection address:', e);
      }

      // Track the pin in Supabase
      if (walletAddress) {
        try {
          await fetch('/api/ipfs/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: walletAddress,
              collectionAddress: deployedAddress,
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

      // Store collection avatar if we have one
      if (deployedAddress && config?.avatarFile) {
        try {
          // Upload avatar to IPFS
          const pinata = new PinataClient(
            process.env.NEXT_PUBLIC_PINATA_API_KEY,
            process.env.NEXT_PUBLIC_PINATA_SECRET_KEY
          );
          const avatarResult = await pinata.uploadFile(config.avatarFile, `${config.name}-avatar`);
          
          // Store in Supabase
          await fetch('/api/collection-avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collectionAddress: deployedAddress,
              ipfsCid: avatarResult.IpfsHash,
              creatorWallet: walletAddress,
            }),
          });
          console.log('Avatar stored for collection:', deployedAddress, avatarResult.IpfsHash);
        } catch (e) {
          console.error('Failed to store avatar:', e);
        }
      }
      
      // Store the deployed address in result for later use
      result.deployedAddress = deployedAddress;

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
      
      // Go to update-uri stage instead of success
      // User MUST update the contract URI before completing
      setStage('update-uri');
      
    } catch (err) {
      console.error('IPFS upload error:', err);
      setIpfsError(err.message);
      setStage('error');
    }
  }, [uploadedData, config, walletAddress, hash]);

  // Handler to update the contract URI
  const updateContractUri = useCallback(async () => {
    if (!wallet || !ipfsResult?.deployedAddress || !ipfsResult?.baseURI) {
      setUriUpdateError('Missing wallet or IPFS data');
      return;
    }
    
    setUriUpdatePending(true);
    setUriUpdateError(null);
    
    try {
      // Switch to Optimism
      await wallet.switchChain(optimism.id);
      
      // Get signer from Privy wallet
      const ethereumProvider = await wallet.getEthereumProvider();
      const provider = new BrowserProvider(ethereumProvider);
      const signer = await provider.getSigner();
      
      // Call setBaseURI on the deployed contract
      const contract = new Contract(ipfsResult.deployedAddress, NFT_ABI, signer);
      const tx = await contract.setBaseURI(ipfsResult.baseURI);
      
      console.log('setBaseURI tx:', tx.hash);
      setUriUpdateTxHash(tx.hash);
      
      // Wait for confirmation
      await tx.wait();
      
      setUriUpdated(true);
      setStage('success');
      fireConfetti();
      
      if (onComplete) {
        onComplete({
          ...ipfsResult,
          txHash: hash,
          uriUpdateTxHash: tx.hash,
        });
      }
    } catch (err) {
      console.error('setBaseURI failed:', err);
      setUriUpdateError(err.message || 'Failed to update contract URI');
    }
    
    setUriUpdatePending(false);
  }, [wallet, ipfsResult, hash, fireConfetti, onComplete]);

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

  // Inject keyframes
  if (typeof document !== 'undefined' && !document.getElementById('spin3d-keyframes')) {
    const style = document.createElement('style');
    style.id = 'spin3d-keyframes';
    style.textContent = rotateKeyframes;
    document.head.appendChild(style);
  }

  // Get display values for success screen
  const tokenType = TOKEN_TYPE_LABELS[config?.tokenType] || 'ERC-721';
  const license = LICENSE_LABELS[config?.licenseVersion] || 'Commercial';
  const royalty = config?.royaltyFee ? (config.royaltyFee / 100).toFixed(1) : '5.0';
  const totalFiles = ipfsResult?.totalFiles || uploadedData?.totalFiles || config?.maxSupply || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 relative border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button (X) - Hidden during IPFS upload and URI update */}
        {stage !== 'ipfs' && stage !== 'update-uri' && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition"
            aria-label="Close"
          >
            ✕
          </button>
        )}
        
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
            
            <div className="mt-6">
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-300 text-sm underline"
              >
                Cancel deployment
              </button>
            </div>
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

        {/* Update URI Stage - CRITICAL: Must complete before success */}
        {stage === 'update-uri' && (
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-orange-400">Final Step Required!</h2>
            <p className="text-gray-400 mb-6">
              Your images are pinned to IPFS. Now you must update the contract URI to link them.
            </p>
            
            {/* Warning box */}
            <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-4 mb-6 text-left">
              <p className="text-orange-300 text-sm font-medium mb-2">
                🚨 Do not close this page!
              </p>
              <p className="text-orange-200/70 text-sm">
                If you leave without updating the URI, your NFT images will not display.
                You'll need to manually fix it later in the Creator Dashboard.
              </p>
            </div>
            
            {/* IPFS Info */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Contract</span>
                <a
                  href={`https://optimistic.etherscan.io/address/${ipfsResult?.deployedAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline text-sm truncate max-w-[200px]"
                >
                  {ipfsResult?.deployedAddress?.slice(0, 10)}...{ipfsResult?.deployedAddress?.slice(-8)} ↗
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Images (IPFS)</span>
                <span className="text-green-400 text-sm">✓ Pinned</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">New URI</span>
                <span className="text-gray-300 text-sm truncate max-w-[200px]" title={ipfsResult?.baseURI}>
                  {ipfsResult?.baseURI?.slice(0, 30)}...
                </span>
              </div>
            </div>
            
            {uriUpdateError && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{uriUpdateError}</p>
              </div>
            )}
            
            {uriUpdateTxHash && !uriUpdated && (
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4">
                <p className="text-blue-400 text-sm">
                  Transaction submitted!{' '}
                  <a 
                    href={`https://optimistic.etherscan.io/tx/${uriUpdateTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View on Etherscan ↗
                  </a>
                </p>
              </div>
            )}
            
            <button
              onClick={updateContractUri}
              disabled={uriUpdatePending}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition shadow-lg shadow-orange-500/20"
            >
              {uriUpdatePending ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Updating Contract...
                </span>
              ) : (
                '🔗 Update Contract URI'
              )}
            </button>
            
            <p className="text-gray-500 text-xs mt-4">
              This will call <code className="bg-gray-800 px-1 rounded">setBaseURI()</code> on your contract. 
              Requires a small gas fee on Optimism.
            </p>
          </div>
        )}

        {/* Success Stage */}
        {stage === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4 animate-spin-slow">
              <div style={{ animation: 'spin3d 3s ease-in-out infinite' }}>
              <Checkmark3D size={96} />
            </div>
            </div>
            <h2 className="text-3xl font-bold mb-2 text-green-400">🎉 Successful Deployment!</h2>
            <p className="text-gray-400 mb-6">Your NFT collection is now live on <span className="text-red-400 font-medium">Optimism</span></p>

            {/* Collection Details Card */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-left">
              {/* Avatar + Name Header */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-700">
                {config?.avatarPreview && (
                  <img 
                    src={config.avatarPreview} 
                    alt="Collection avatar"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-cyan-500"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg">{config?.name || 'My Collection'}</h3>
                  <p className="text-gray-400 text-sm">{config?.symbol || 'NFT'}</p>
                </div>
              </div>
              
              {/* Description */}
              {config?.description && (
                <p className="text-gray-300 text-sm mb-4 italic">
                  "{config.description.slice(0, 150)}{config.description.length > 150 ? '...' : ''}"
                </p>
              )}
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Standard</span>
                  <span className="text-white font-medium">{tokenType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Supply</span>
                  <span className="text-white font-medium">{config?.maxSupply || '?'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Royalty</span>
                  <span className="text-white font-medium">{royalty}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">License</span>
                  <span className="text-white font-medium">{license}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-gray-400">Images Pinned</span>
                  <span className="text-cyan-400 font-medium">📌 {totalFiles} to IPFS</span>
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="bg-gray-800/30 rounded-xl p-4 mb-6 text-left space-y-3">
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

            {/* Share on X Button - Primary CTA */}
            <button
              onClick={shareOnX}
              className="w-full px-6 py-4 bg-black hover:bg-gray-900 border border-gray-600 hover:border-gray-500 rounded-xl font-medium transition flex items-center justify-center gap-3 mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>Share on X</span>
            </button>

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
