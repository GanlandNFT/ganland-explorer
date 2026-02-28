'use client';

import { useState } from 'react';
import { LaunchpadForm } from '@/components/launch/LaunchpadForm';
import { CollectionUploader } from '@/components/launch/CollectionUploader';
import { LaunchPreview } from '@/components/launch/LaunchPreview';
import { MyCollections } from '@/components/launch/MyCollections';
import { useLaunchpad } from '@/hooks/useLaunchpad';

export default function LaunchPage() {
  const [step, setStep] = useState(1);
  const [uploadedData, setUploadedData] = useState(null);
  const [launchConfig, setLaunchConfig] = useState(null);
  
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
    userCollections,
    createLaunch,
    TOKEN_TYPES,
    LICENSE_VERSIONS,
  } = useLaunchpad();

  const handleUploadComplete = (data) => {
    setUploadedData(data);
    setStep(2);
  };

  const handleConfigComplete = (config) => {
    setLaunchConfig(config);
    setStep(3);
  };

  const handleLaunch = async () => {
    try {
      await createLaunch({
        ...launchConfig,
        baseURI: uploadedData.baseURI,
      });
      setStep(4);
    } catch (err) {
      console.error('Launch failed:', err);
    }
  };

  // Steps config
  const steps = ['Upload', 'Configure', 'Review', 'Launch'];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 py-3 sm:py-6 px-3 sm:px-8">
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

      <main className="max-w-6xl mx-auto py-4 sm:py-8 px-0 sm:px-8">
        {/* Progress Steps - Vertical on mobile, horizontal on desktop */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="grid grid-cols-4 gap-2 sm:flex sm:items-center sm:gap-0 w-full max-w-md sm:max-w-none sm:w-auto">
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

        {/* Step Content - Animated border container */}
        <div className="relative rounded-none sm:rounded-2xl p-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 bg-[length:200%_100%] animate-gradient-x min-h-[300px] mx-0">
          <div className="bg-gray-900 rounded-none sm:rounded-2xl p-4 sm:p-8 h-full">
          
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

          {/* Authenticated but waiting for wallet address */}
          {ready && authenticated && !isConnected && step < 4 && (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-400">Connecting wallet...</p>
            </div>
          )}

          {/* Step 1: Upload */}
          {ready && isConnected && step === 1 && (
            <CollectionUploader onComplete={handleUploadComplete} />
          )}
          
          {/* Step 2: Configure */}
          {ready && isConnected && step === 2 && (
            <LaunchpadForm 
              uploadedData={uploadedData}
              onComplete={handleConfigComplete}
              onBack={() => setStep(1)}
              tokenTypes={TOKEN_TYPES}
              licenseVersions={LICENSE_VERSIONS}
            />
          )}
          
          {/* Step 3: Review */}
          {ready && isConnected && step === 3 && (
            <LaunchPreview
              uploadedData={uploadedData}
              config={launchConfig}
              platformFee={isAuthorized ? '0' : platformFee}
              onLaunch={handleLaunch}
              onBack={() => setStep(2)}
              isLoading={isLoading}
            />
          )}
          
          {/* Step 4: Launch result */}
          {step === 4 && (
            <div className="text-center py-12">
              {isLoading && (
                <div>
                  <div className="animate-spin w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6" />
                  <h2 className="text-2xl font-bold mb-2">Deploying Collection...</h2>
                  <p className="text-gray-400">Please confirm the transaction in your wallet</p>
                </div>
              )}
              
              {isSuccess && (
                <div>
                  <div className="text-6xl mb-6">🎉</div>
                  <h2 className="text-2xl font-bold mb-2 text-green-400">Collection Deployed!</h2>
                  <p className="text-gray-400 mb-6">Your NFT collection is now live on Optimism</p>
                  <a 
                    href={`https://optimistic.etherscan.io/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    View Transaction →
                  </a>
                </div>
              )}
              
              {error && (
                <div>
                  <div className="text-6xl mb-6">❌</div>
                  <h2 className="text-2xl font-bold mb-2 text-red-400">Launch Failed</h2>
                  <p className="text-gray-400 mb-6">{error}</p>
                  <button
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* My Collections Section */}
        {isConnected && (userCollections.erc721.length > 0 || userCollections.erc1155.length > 0) && (
          <div className="mt-8 sm:mt-12">
            <MyCollections collections={userCollections} />
          </div>
        )}
      </main>

        {/* Agent API Section */}
        <div className="mt-8 sm:mt-12 px-0 sm:px-0">
          <div className="bg-gray-900/50 rounded-none sm:rounded-2xl p-4 sm:p-8 border-y sm:border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="text-xl font-bold">Agent API</h3>
            </div>
            <p className="text-gray-400 mb-4 text-sm sm:text-base">
              Deploy NFT collections programmatically via the GAN Launchpad API.
            </p>
            
            <div className="bg-gray-800 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto">
              <p className="text-gray-500 mb-2"># Contract Address (Optimism)</p>
              <p className="text-cyan-400 mb-4">0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed</p>
              
              <p className="text-gray-500 mb-2"># Create Launch Function</p>
              <p className="text-green-400">createLaunch(</p>
              <p className="text-gray-300 pl-4">name: string,</p>
              <p className="text-gray-300 pl-4">symbol: string,</p>
              <p className="text-gray-300 pl-4">maxSupply: uint256,</p>
              <p className="text-gray-300 pl-4">baseURI: string,</p>
              <p className="text-gray-300 pl-4">royaltyFee: uint256, <span className="text-gray-500">// basis points (500 = 5%)</span></p>
              <p className="text-gray-300 pl-4">licenseVersion: uint8,</p>
              <p className="text-gray-300 pl-4">tokenType: uint8 <span className="text-gray-500">// 0 = ERC721, 1 = ERC1155</span></p>
              <p className="text-green-400">)</p>
              <p className="text-gray-500 mt-2"># Value: 0.01 ETH (platform fee, waived for authorized creators)</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <a 
                href="https://optimistic.etherscan.io/address/0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed#code"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition"
              >
                View Contract ↗
              </a>
              <a 
                href="/docs/launchpad-api"
                className="px-4 py-2 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30 rounded-lg text-sm transition"
              >
                API Documentation
              </a>
            </div>
          </div>
        </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 sm:py-6 px-3 sm:px-8 mt-8 sm:mt-12">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Powered by Fractal Visions • Built on Optimism</p>
        </div>
      </footer>
    </div>
  );
}
