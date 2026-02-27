/**
 * Launchpad API for AI Agents
 * 
 * Endpoints:
 * - POST /api/launch/prepare - Upload files and prepare launch
 * - POST /api/launch/create - Generate transaction data for createLaunch
 * - GET /api/launch/:id - Get launch info
 * - GET /api/launch/collections/:address - Get collections by creator
 */

import { NextResponse } from 'next/server';
import { encodeFunctionData, parseEther } from 'viem';
import { CONTRACTS, PLATFORM_FEE, TOKEN_TYPES, LICENSE_VERSIONS } from '@/lib/contracts/addresses';
import FractalLaunchpadABI from '@/lib/contracts/FractalLaunchpadABI.json';
import { PinataClient } from '@/lib/pinata';

const CHAIN_ID = 10; // Optimism
const LAUNCHPAD_ADDRESS = CONTRACTS[CHAIN_ID].LAUNCHPAD;

export async function GET(request) {
  return NextResponse.json({
    name: 'Fractal Visions Launchpad API',
    version: '1.0.0',
    chain: 'optimism',
    chainId: CHAIN_ID,
    contracts: CONTRACTS[CHAIN_ID],
    platformFee: PLATFORM_FEE,
    tokenTypes: TOKEN_TYPES,
    licenseVersions: LICENSE_VERSIONS,
    endpoints: {
      'POST /api/launch/prepare': 'Upload images/metadata to IPFS',
      'POST /api/launch/tx': 'Generate createLaunch transaction data',
      'GET /api/launch?id=<launchId>': 'Get launch info by ID',
      'GET /api/launch?creator=<address>': 'Get collections by creator',
    },
    example: {
      prepare: {
        images: ['base64 encoded image data or URLs'],
        metadata: 'optional - array of metadata objects',
        collectionName: 'My Collection',
      },
      tx: {
        name: 'My Collection',
        symbol: 'MC',
        maxSupply: 100,
        baseURI: 'ipfs://Qm.../metadata/',
        royaltyFee: 500,
        licenseVersion: 2,
        tokenType: 0,
      },
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'prepare':
        return handlePrepare(body);
      case 'tx':
        return handleGenerateTx(body);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "prepare" or "tx"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Prepare launch - upload files to IPFS
 */
async function handlePrepare(body) {
  const { 
    images, // Array of { data: base64, name: string, type: string }
    metadata, // Optional: Array of metadata objects
    collectionName,
    description = '',
  } = body;

  if (!images || !Array.isArray(images) || images.length === 0) {
    return NextResponse.json(
      { error: 'images array is required' },
      { status: 400 }
    );
  }

  const pinata = new PinataClient(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY
  );

  // Upload images
  const imageHashes = [];
  for (const img of images) {
    const buffer = Buffer.from(img.data, 'base64');
    const blob = new Blob([buffer], { type: img.type || 'image/png' });
    const result = await pinata.uploadFile(blob, img.name);
    imageHashes.push(result.IpfsHash);
  }

  // Generate or use provided metadata
  let metadataHashes = [];
  if (metadata && Array.isArray(metadata)) {
    // Use provided metadata
    for (let i = 0; i < metadata.length; i++) {
      const meta = {
        ...metadata[i],
        image: metadata[i].image || `ipfs://${imageHashes[i]}`,
      };
      const result = await pinata.uploadJSON(meta, `${i + 1}.json`);
      metadataHashes.push(result.IpfsHash);
    }
  } else {
    // Auto-generate metadata
    for (let i = 0; i < imageHashes.length; i++) {
      const meta = {
        name: `${collectionName} #${i + 1}`,
        description,
        image: `ipfs://${imageHashes[i]}`,
        attributes: [],
      };
      const result = await pinata.uploadJSON(meta, `${i + 1}.json`);
      metadataHashes.push(result.IpfsHash);
    }
  }

  // Upload metadata folder
  const folderResult = await pinata.uploadFolder(
    metadataHashes.map((hash, i) => 
      new File([JSON.stringify({ redirect: `ipfs://${hash}` })], `${i + 1}.json`)
    ),
    `${collectionName}-metadata`
  );

  return NextResponse.json({
    success: true,
    data: {
      imageHashes,
      metadataHashes,
      baseURI: `ipfs://${folderResult.ipfsHash}/${collectionName}-metadata/`,
      totalFiles: images.length,
    },
  });
}

/**
 * Generate createLaunch transaction data
 */
async function handleGenerateTx(body) {
  const {
    name,
    symbol,
    maxSupply,
    baseURI,
    royaltyFee = 500,
    licenseVersion = LICENSE_VERSIONS.COMMERCIAL,
    tokenType = TOKEN_TYPES.ERC721,
    isAuthorized = false,
  } = body;

  // Validate required fields
  if (!name || !symbol || !maxSupply || !baseURI) {
    return NextResponse.json(
      { error: 'Missing required fields: name, symbol, maxSupply, baseURI' },
      { status: 400 }
    );
  }

  // Encode function call
  const data = encodeFunctionData({
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
  });

  // Calculate value (platform fee unless authorized)
  const value = isAuthorized ? '0' : PLATFORM_FEE;

  return NextResponse.json({
    success: true,
    transaction: {
      to: LAUNCHPAD_ADDRESS,
      data,
      value,
      chainId: CHAIN_ID,
    },
    decoded: {
      name,
      symbol,
      maxSupply,
      baseURI,
      royaltyFee,
      royaltyPercent: `${royaltyFee / 100}%`,
      licenseVersion,
      tokenType: tokenType === 0 ? 'ERC721' : 'ERC1155',
      platformFee: isAuthorized ? '0 ETH (authorized)' : `${parseFloat(PLATFORM_FEE) / 1e18} ETH`,
    },
  });
}
