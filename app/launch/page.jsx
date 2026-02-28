'use client';

import { useState, useEffect, useCallback } from 'react';
import { LaunchpadForm } from '@/components/launch/LaunchpadForm';
import { CollectionUploader } from '@/components/launch/CollectionUploader';
import { LaunchPreview } from '@/components/launch/LaunchPreview';
import { DeploymentModal } from '@/components/launch/DeploymentModal';
import { WalletConnectedModal } from '@/components/launch/WalletConnectedModal';
import { useLaunchpad } from '@/hooks/useLaunchpad';

export default function LaunchPage() {
  const [step, setStep] = useState(1);
  const [uploadedData, setUploadedData] = useState(null);
  const [launchConfig, setLaunchConfig] = useState(null);
  const [draftConfig, setDraftConfig] = useState(null); // Loaded from Supabase
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  
  const {
    ready,
    authenticated,
    isConnected,
    address,
    user,
    isLoading,
    isSuccess,
    error,
    hash,
    isAuthorized,
    platformFee,
    createLaunch,
    switchToOptimism,
    wrongChain,
    isSwitching,
    hasEmbeddedWallet,
    usingExternalWallet,
    balance,
    balanceFormatted,
    balanceLoading,
    hasEnoughBalance,
    TOKEN_TYPES,
    LICENSE_VERSIONS,
  } = useLaunchpad();
  
  // Show wallet connected modal when first connecting
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [hasShownWalletModal, setHasShownWalletModal] = useState(false);
  const [acknowledgedExternalWallet, setAcknowledgedExternalWallet] = useState(false);
  
  // Show connection modal when wallet first connects
  useEffect(() => {
    if (isConnected && hasEmbeddedWallet && !hasShownWalletModal) {
      setShowWalletModal(true);
      setHasShownWalletModal(true);
    }
  }, [isConnected, hasEmbeddedWallet, hasShownWalletModal]);

  // Load draft config from Supabase when wallet connects
  useEffect(() => {
    async function loadDraftConfig() {
      if (!address) return;
      
      try {
        const res = await fetch(`/api/drafts?wallet=${encodeURIComponent(address)}`);
        const data = await res.json();
        
        if (data.draft?.launch_config && Object.keys(data.draft.launch_config).length > 0) {
          setDraftConfig(data.draft.launch_config);
        }
      } catch (e) {
        console.error('Failed to load draft config:', e);
      }
    }
    
    loadDraftConfig();
  }, [address]);

  const handleUploadComplete = (data) => {
    setUploadedData(data);
    setStep(2);
  };

  const handleConfigComplete = async (config) => {
    // Auto-save config to draft before proceeding
    // EXCLUDE avatar from draft (it's a File object and doesn't persist well)
    if (address) {
      try {
        const { avatarFile, avatarPreview, ...configWithoutAvatar } = config;
        await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet: address,
            collectionName: config.name,
            description: config.description,
            config: configWithoutAvatar, // Avatar NOT saved - must re-upload
            step: 3,
          }),
        });
      } catch (e) {
        console.error('Failed to save draft config:', e);
      }
    }
    
    setLaunchConfig(config);
    setDraftConfig(config); // Keep in state for back navigation (includes avatar for current session)
    setStep(3);
  };

  const handleLaunch = async (finalUploadData) => {
    // Open the deployment modal
    setShowDeployModal(true);
    
    try {
      // Use the upload data (files will be pinned after payment)
      const dataToUse = finalUploadData || uploadedData;
      
      // Start the contract deployment
      // The modal will handle showing progress and IPFS upload after tx success
      await createLaunch({
        ...launchConfig,
        // baseURI will be set after IPFS upload in the modal
        baseURI: dataToUse.baseURI || 'ipfs://pending',
      });

    } catch (err) {
      console.error('Launch failed:', err);
    }
  };

  const handleDeploymentComplete = (result) => {
    setDeploymentResult(result);
  };

  const handleModalClose = () => {
    setShowDeployModal(false);
    if (isSuccess) {
      // Reset to show success state
      setStep(4);
    }
  };

  // Handle cancel/rejection - just close the modal
  const handleDeployCancel = () => {
    setShowDeployModal(false);
    // Stay on step 3 (review) so user can try again
  };

  // Steps config
  const steps = ['Upload', 'Configure', 'Review', 'Launch'];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Wallet Connected Modal - Shows briefly when user connects */}
      <WalletConnectedModal
        isOpen={showWalletModal}
        walletAddress={address}
        onComplete={() => setShowWalletModal(false)}
        duration={5000}
      />

      {/* Deployment Modal */}
      <DeploymentModal
        isOpen={showDeployModal}
        onClose={handleModalClose}
        onCancel={handleDeployCancel}
        config={launchConfig}
        uploadedData={uploadedData}
        walletAddress={address}
        hash={hash}
        isLoading={isLoading}
        isSuccess={isSuccess}
        error={error}
        onComplete={handleDeploymentComplete}
      />

      {/* Header */}
      <header className="border-b border-gray-800 py-3 sm:py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              GAN Launchpad
            </h1>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">Deploy NFT collections on Optimism</p>
          </div>
          <div className="text-right">
            {isAuthorized && (
              <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
                ✓ Authorized Creator
              </span>
            )}
            {!isAuthorized && (
              <span className="text-gray-500 text-sm">
                Platform Fee: {platformFee} ETH
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col py-4 sm:py-8 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Progress Steps - Vertical on mobile, horizontal on desktop */}
        <div className="flex justify-center mb-6 sm:mb-10">
          <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-0 w-full max-w-md sm:max-w-none sm:w-auto px-2 sm:px-0">
            {steps.map((label, i) => (
              <div key={label} className="flex flex-col items-center sm:flex-row">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base
                    ${step > i + 1 ? 'bg-green-500' : step === i + 1 ? 'bg-cyan-500' : 'bg-gray-700'}
                  `}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  {/* Label below circle */}
                  <span className={`mt-2 text-xs sm:text-sm text-center ${step === i + 1 ? 'text-cyan-400 font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
                {/* Connector line - only on desktop, between items */}
                {i < 3 && (
                  <div className="hidden sm:block w-12 lg:w-20 h-0.5 mx-2 bg-gray-700" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content - Animated border container with rounded corners */}
        <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x flex-1">
          <div className="bg-gray-900 rounded-2xl p-4 sm:p-8 h-full min-h-[300px]">
          
            {/* Loading state while Privy initializes */}
            {!ready && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mb-4" />
                <p className="text-gray-400">Loading...</p>
              </div>
            )}

            {/* Wallet Connection Gate - show when ready but not authenticated */}
            {ready && !authenticated && step < 4 && (
              <div className="text-center py-8 sm:py-12">
                <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🔐</div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Connect Your Wallet</h2>
                <p className="text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                  Connect your wallet to create an NFT collection on the GAN Launchpad.
                </p>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Click "Connect Wallet" in the header to get started.
                </p>
              </div>
            )}

          {/* Security Gate - Shows for ALL users after wallet modal closes */}
          {ready && authenticated && step < 4 && !acknowledgedExternalWallet && hasShownWalletModal && (
            <div className="text-center py-8 sm:py-12">
              {/* Show embedded wallet at top in green */}
              {address && (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-600/50 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm font-medium">Embedded Wallet Protected by Privy</span>
                  <span className="text-green-300 font-mono text-xs">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </div>
              )}
              
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">⚠️</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-red-400">External Wallet Not Supported</h2>
              <p className="text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                For security, the GAN Launchpad only supports <strong className="text-white">Privy embedded wallets</strong>.
                External wallets (MetaMask, Coinbase, etc.) cannot be used for deployments.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 max-w-md mx-auto mb-6">
                <p className="text-yellow-400 text-sm">
                  <strong>Why?</strong> Embedded wallets ensure your collection is linked to your Ganland account.
                  Please remember you can change the admin of the contract through the creator dashboard after deployment.
                </p>
              </div>
              
              {/* Acknowledgment buttons */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-gray-500 text-sm">Do you understand and want to continue?</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAcknowledgedExternalWallet(true)}
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition"
                  >
                    Yes, Continue
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                  >
                    No, Go Back
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Authenticated but waiting for wallet address */}
          {ready && authenticated && !isConnected && step < 4 && (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Connecting wallet...</p>
            </div>
          )}

          {/* Step 1: Upload - Only with embedded wallet */}
          {ready && isConnected && acknowledgedExternalWallet && step === 1 && (
            <CollectionUploader onComplete={handleUploadComplete} />
          )}
          
          {/* Step 2: Configure - Only with embedded wallet */}
          {ready && isConnected && acknowledgedExternalWallet && step === 2 && (
            <LaunchpadForm 
              uploadedData={uploadedData}
              initialValues={launchConfig || draftConfig}
              onComplete={handleConfigComplete}
              onBack={() => setStep(1)}
              tokenTypes={TOKEN_TYPES}
              licenseVersions={LICENSE_VERSIONS}
            />
          )}
          
          {/* Step 3: Review - Only with embedded wallet */}
          {ready && isConnected && acknowledgedExternalWallet && step === 3 && (
            <LaunchPreview
              uploadedData={uploadedData}
              config={launchConfig}
              platformFee={isAuthorized ? '0' : platformFee}
              onLaunch={handleLaunch}
              onBack={() => setStep(2)}
              isLoading={isLoading}
              wrongChain={wrongChain}
              onSwitchChain={switchToOptimism}
              isSwitching={isSwitching}
              walletAddress={address}
              balanceFormatted={balanceFormatted}
              hasEnoughBalance={hasEnoughBalance || isAuthorized}
              balanceLoading={balanceLoading}
            />
          )}
          
          {/* Step 4: Final success page (after modal closes) */}
          {step === 4 && deploymentResult && (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="text-2xl font-bold mb-2 text-green-400">Collection Deployed!</h2>
              <p className="text-gray-400 mb-6">Your NFT collection is now live on Optimism</p>

              {/* Links */}
              <div className="max-w-md mx-auto bg-gray-800/50 rounded-xl p-4 mb-6 text-left space-y-3">
                {deploymentResult.txHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Transaction</span>
                    <a
                      href={`https://optimistic.etherscan.io/tx/${deploymentResult.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline text-sm"
                    >
                      View on Etherscan ↗
                    </a>
                  </div>
                )}
                {deploymentResult.imagesHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Images (IPFS)</span>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${deploymentResult.imagesHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline text-sm"
                    >
                      View on IPFS ↗
                    </a>
                  </div>
                )}
                {deploymentResult.metadataHash && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Metadata (IPFS)</span>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${deploymentResult.metadataHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline text-sm"
                    >
                      View on IPFS ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Listing CTA */}
              <div className="max-w-md mx-auto bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl p-4 border border-cyan-700/30 mb-6">
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
                onClick={() => {
                  setStep(1);
                  setUploadedData(null);
                  setLaunchConfig(null);
                  setDeploymentResult(null);
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Launch Another Collection
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Agent API Section */}
        <div className="mt-8 sm:mt-10">
          <div className="bg-gray-900/50 rounded-2xl p-4 sm:p-8 border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-xl font-bold">Agent API</h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              Deploy NFT collections programmatically via the GAN Launchpad smart contract.
            </p>
            
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto">
              <p className="text-gray-500 mb-2"># Contract Address (Optimism)</p>
              <p className="text-cyan-400 mb-4 break-all">0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed</p>
              
              <p className="text-gray-500 mb-2"># Create Launch Function</p>
              <p className="text-green-400">createLaunch(</p>
              <p className="text-gray-300 pl-4">name, symbol, maxSupply, baseURI,</p>
              <p className="text-gray-300 pl-4">royaltyFee, licenseVersion, tokenType</p>
              <p className="text-green-400">)</p>
              <p className="text-gray-500 mt-2"># Value: 0.01 ETH platform fee</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a 
                href="https://optimistic.etherscan.io/address/0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed#code"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full text-sm transition"
              >
                View Contract ↗
              </a>
              <a 
                href="/docs/launchpad-api"
                className="px-4 py-2 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 rounded-full text-sm transition"
              >
                Full API Documentation
              </a>
            </div>
          </div>
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 sm:py-6 px-4 sm:px-8 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Powered by Fractal Visions • Built on Optimism</p>
        </div>
      </footer>
    </div>
  );
}
