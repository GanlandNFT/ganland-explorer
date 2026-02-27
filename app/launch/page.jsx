'use client';

import { useState } from 'react';
import { LaunchpadForm } from '@/components/launch/LaunchpadForm';
import { CollectionUploader } from '@/components/launch/CollectionUploader';
import { LaunchPreview } from '@/components/launch/LaunchPreview';
import { MyCollections } from '@/components/launch/MyCollections';
import { useLaunchpad } from '@/hooks/useLaunchpad';

export default function LaunchPage() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Review, 4: Launch
  const [uploadedData, setUploadedData] = useState(null);
  const [launchConfig, setLaunchConfig] = useState(null);
  
  const {
    isConnected,
    address,
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 py-6 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Fractal Visions Launchpad
            </h1>
            <p className="text-gray-400 mt-1">Deploy NFT collections on Optimism</p>
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

      <main className="max-w-6xl mx-auto py-8 px-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {['Upload', 'Configure', 'Review', 'Launch'].map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold
                ${step > i + 1 ? 'bg-green-500' : step === i + 1 ? 'bg-cyan-500' : 'bg-gray-700'}
              `}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span className={`ml-2 ${step === i + 1 ? 'text-cyan-400' : 'text-gray-500'}`}>
                {label}
              </span>
              {i < 3 && <div className="w-16 h-0.5 mx-4 bg-gray-700" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          {step === 1 && (
            <CollectionUploader onComplete={handleUploadComplete} />
          )}
          
          {step === 2 && (
            <LaunchpadForm 
              uploadedData={uploadedData}
              onComplete={handleConfigComplete}
              onBack={() => setStep(1)}
              tokenTypes={TOKEN_TYPES}
              licenseVersions={LICENSE_VERSIONS}
            />
          )}
          
          {step === 3 && (
            <LaunchPreview
              uploadedData={uploadedData}
              config={launchConfig}
              platformFee={isAuthorized ? '0' : platformFee}
              onLaunch={handleLaunch}
              onBack={() => setStep(2)}
              isLoading={isLoading}
            />
          )}
          
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

        {/* My Collections Section */}
        {isConnected && (userCollections.erc721.length > 0 || userCollections.erc1155.length > 0) && (
          <div className="mt-12">
            <MyCollections collections={userCollections} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 px-8 mt-12">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Powered by Fractal Visions • Built on Optimism</p>
          <p className="mt-1">
            <a href="/launch/api" className="text-cyan-400 hover:underline">API Docs</a>
            {' • '}
            <a href="https://ganland.io" className="text-cyan-400 hover:underline">Ganland</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
