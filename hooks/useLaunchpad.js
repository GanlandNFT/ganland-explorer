'use client';

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { optimism } from 'viem/chains';

import { GANLAND_CONTRACTS, PLATFORM_FEE, TOKEN_TYPES, LICENSE_VERSIONS } from '@/lib/contracts/addresses';
import FractalLaunchpadABI from '@/lib/contracts/FractalLaunchpadABI.json';

export function useLaunchpad() {
  const { address, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const launchpadAddress = GANLAND_CONTRACTS.launchpad;

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
  }, [isConnected, isAuthorized, platformFee, launchpadAddress, writeContract]);

  /**
   * Get launch info by ID
   */
  const getLaunchInfo = useCallback(async (launchId) => {
    // This would need to be called via a read contract
    // Return format matches LaunchConfig struct
  }, []);

  return {
    // State
    isConnected,
    address,
    isLoading: isLoading || isPending || isConfirming,
    isSuccess,
    error,
    hash,

    // Data
    isAuthorized,
    platformFee: platformFee ? formatEther(platformFee) : '0.01',
    nextLaunchId: nextLaunchId?.toString() || '0',
    userCollections: {
      erc721: userERC721s || [],
      erc1155: userERC1155s || [],
    },

    // Actions
    createLaunch,
    getLaunchInfo,

    // Constants
    TOKEN_TYPES,
    LICENSE_VERSIONS,
  };
}

export default useLaunchpad;
