import { NextResponse } from 'next/server';
import { PinataClient } from '@/lib/pinata';

export const dynamic = 'force-dynamic';

/**
 * POST /api/collections/fix-metadata
 * 
 * Generates and uploads missing metadata JSON files for a collection
 * where images exist but metadata was never uploaded.
 * 
 * Body:
 * - imagesCid: IPFS CID where images are stored
 * - imagesPath: Path within CID (e.g., "Firestorm-images")
 * - collectionName: Name for the collection
 * - description: Collection description
 * - totalSupply: Number of tokens
 * - startIndex: Token numbering starts at (default: 0)
 * - imageExtension: Image file extension (default: ".jpg")
 * - attributes: Optional array of attributes for all tokens
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      imagesCid,
      imagesPath = '',
      collectionName,
      description = '',
      totalSupply,
      startIndex = 0,
      imageExtension = '.jpg',
      attributes = [],
    } = body;

    if (!imagesCid || !collectionName || !totalSupply) {
      return NextResponse.json({
        error: 'Missing required fields: imagesCid, collectionName, totalSupply'
      }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        error: 'Pinata API keys not configured'
      }, { status: 500 });
    }

    const pinata = new PinataClient(apiKey, secretKey);
    
    // Build image base path
    const imageBasePath = imagesPath 
      ? `ipfs://${imagesCid}/${imagesPath}/`
      : `ipfs://${imagesCid}/`;

    // Generate metadata files
    const metadataFiles = [];
    for (let i = startIndex; i < startIndex + totalSupply; i++) {
      const tokenId = i;
      const imageNumber = i - startIndex + 1; // Images often start at 1
      
      const metadata = {
        name: totalSupply === 1 
          ? collectionName 
          : `${collectionName} #${tokenId}`,
        description,
        image: `${imageBasePath}${imageNumber}${imageExtension}`,
        attributes: attributes.length > 0 ? attributes : [
          { trait_type: 'Collection', value: collectionName },
          { trait_type: 'Token ID', value: tokenId.toString() },
        ],
        external_url: `https://ganland.ai/nft/${tokenId}`,
      };

      // Create a Blob/File for the JSON
      const jsonContent = JSON.stringify(metadata, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const file = new File([blob], `${tokenId}.json`, { type: 'application/json' });
      metadataFiles.push(file);
    }

    // Upload metadata folder to Pinata
    const metadataFolderName = `${collectionName.replace(/[^a-zA-Z0-9]/g, '-')}-metadata`;
    const result = await pinata.uploadFolder(metadataFiles, metadataFolderName);

    // The baseURI should be the metadata folder with trailing slash
    const baseURI = `ipfs://${result.ipfsHash}/${metadataFolderName}/`;

    return NextResponse.json({
      success: true,
      metadataCid: result.ipfsHash,
      baseURI,
      folderName: metadataFolderName,
      totalFiles: metadataFiles.length,
      message: `Metadata uploaded! Now call setBaseURI("${baseURI}") on the contract.`,
      example: {
        tokenURI_0: `${baseURI}0.json`,
        resolves_to: `https://gateway.pinata.cloud/ipfs/${result.ipfsHash}/${metadataFolderName}/0.json`,
      }
    });
  } catch (err) {
    console.error('Fix metadata error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
