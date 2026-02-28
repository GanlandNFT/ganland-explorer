'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSwitchChain, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { optimism } from 'viem/chains';

import { CONTRACTS, PLATFORM_FEE, TOKEN_TYPES, LICENSE_VERSIONS } from '@/lib/contracts/addresses';
import FractalLaunchpadABI from '@/lib/contracts/FractalLaunchpadABI.json';

// Required chain for deployment
const REQUIRED_CHAIN_ID = optimism.id; // 10

export function useLaunchpad() {
  // Privy auth state (for login status)
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  // Wagmi state (for contract interactions)
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  // Combined connection state - user is authenticated via Privy
  const isAuthenticated = ready && authenticated;
  const address = wagmiAddress || wallets?.[0]?.address;
  const isConnected = isAuthenticated && !!address;
  
  // Check if on correct chain
  const isOnOptimism = chainId === REQUIRED_CHAIN_ID;
  const wrongChain = isConnected && !isOnOptimism;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const launchpadAddress = CONTRACTS[optimism.id]?.LAUNCHPAD;

  // Check if user is authorized (free launches)
  const { data: isAuthorized } = useReadContract({
    address: launchpadAddress,
    abi: FractalLaunchpadABI,
    functionName: 'authorizedCreators',
    args: [address],
    enabled: !!address,
  });

  // Get platform fee
  const { data: platformFee } = useReadContract({
    address: launchpadAddress,
    abi: FractalLaunchpadABI,
    functionName: 'platformFee',
  });

  // Get next launch ID
  const { data: nextLaunchId } = useReadContract({
    address: launchpadAddress,
    abi: FractalLaunchpadABI,
    functionName: 'nextLaunchId',
  });

  // Get user's ERC721 collections
  const { data: userERC721s } = useReadContract({
    address: launchpadAddress,
    abi: FractalLaunchpadABI,
    functionName: 'getERC721sByCreator',
    args: [address],
    enabled: !!address,
  });

  // Get user's ERC1155 collections
  const { data: userERC1155s } = useReadContract({
    address: launchpadAddress,
    abi: FractalLaunchpadABI,
    functionName: 'getERC1155sByCreator',
    args: [address],
    enabled: !!address,
  });

  // Write contract hook
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Switch wallet to Optimism network
   */
  const switchToOptimism = useCallback(async () => {
    if (!switchChain) return;
    try {
      await switchChain({ chainId: REQUIRED_CHAIN_ID });
    } catch (err) {
      setError('Failed to switch to Optimism. Please switch manually in your wallet.');
      throw err;
    }
  }, [switchChain]);

  /**
   * Create a new NFT collection launch
   * @param {Object} params - Launch parameters
   */
  const createLaunch = useCallback(async ({
    name,
    symbol,
    maxSupply,
    baseURI,
    royaltyFee, // In basis points (e.g., 500 = 5%)
    licenseVersion = LICENSE_VERSIONS.COMMERCIAL,
    tokenType = TOKEN_TYPES.ERC721,
  }) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    
    // CRITICAL: Ensure we're on Optimism before deployment
    if (!isOnOptimism) {
      throw new Error('Please switch to Optimism network before deploying');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate fee (0 if authorized)
      const fee = isAuthorized ? 0n : BigInt(platformFee || PLATFORM_FEE);

      writeContract({
        address: launchpadAddress,
        abi: FractalLaunchpadABI,
        functionName: 'createLaunch',
        args: [
          name,
          symbol,
          BigInt(maxSupply),
          baseURI,
          BigInt(royaltyFee),
          licenseVersion,
          tokenType,
        ],
        value: fee,
        chain: optimism,
      });

    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, [isConnected, isOnOptimism, isAuthorized, platformFee, launchpadAddress, writeContract]);

  /**
   * Get launch info by ID
   */
  const getLaunchInfo = useCallback(async (launchId) => {
    // This would need to be called via a read contract
    // Return format matches LaunchConfig struct
  }, []);

  return {
    // Auth state
    ready,           // Privy SDK ready
    authenticated,   // User logged in via Privy
    isConnected,     // Authenticated + has wallet address
    address,
    user,
    
    // Chain state
    chainId,
    isOnOptimism,    // True if connected to Optimism (chain 10)
    wrongChain,      // True if connected but NOT on Optimism
    isSwitching,     // True while switching chains
    
    // Loading/status
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash,

    // Data
    isAuthorized,
    platformFee: platformFee ? String(formatEther(platformFee)) : '0.01',
    nextLaunchId: nextLaunchId?.toString() || '0',
    userCollections: {
      // Convert to string array to prevent React rendering errors
      erc721: (userERC721s || []).map(addr => String(addr)),
      erc1155: (userERC1155s || []).map(addr => String(addr)),
    },

    // Actions
    createLaunch,
    switchToOptimism,
    getLaunchInfo,

    // Constants
    TOKEN_TYPES,
    LICENSE_VERSIONS,
  };
}

export default useLaunchpad;
