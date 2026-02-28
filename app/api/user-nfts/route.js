import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

export const dynamic = 'force-dynamic';

const LAUNCHPAD_ADDRESS = '0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed';

const LAUNCHPAD_ABI = [
  {
    name: 'getERC721sByCreator',
    type: 'function',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view'
  }
];

const NFT_ABI = [
  { name: 'name', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'tokenOfOwnerByIndex', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'index', type: 'uint256' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'tokenURI', type: 'function', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }], stateMutability: 'view' },
];

const publicClient = createPublicClient({
  chain: optimism,
  transport: http()
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const chain = searchParams.get('chain');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  if (chain !== 'optimism') {
    return NextResponse.json({ error: 'Only Optimism supported currently' }, { status: 400 });
  }

  try {
    // Get all Launchpad collections (we'll check each for user's NFTs)
    // For now, check known collections directly
    const knownCollections = [
      // Add known Launchpad collections here, or query events
    ];

    // Query Transfer events to find collections where user has NFTs
    // This is a simplified approach - in production you'd want an indexer
    
    const nfts = [];

    // Try to get user's balance in known collections
    for (const contractAddr of knownCollections) {
      try {
        const balance = await publicClient.readContract({
          address: contractAddr,
          abi: NFT_ABI,
          functionName: 'balanceOf',
          args: [wallet]
        });

        if (balance > 0n) {
          const name = await publicClient.readContract({
            address: contractAddr,
            abi: NFT_ABI,
            functionName: 'name'
          });

          // Get token IDs owned by user
          for (let i = 0n; i < balance; i++) {
            try {
              const tokenId = await publicClient.readContract({
                address: contractAddr,
                abi: NFT_ABI,
                functionName: 'tokenOfOwnerByIndex',
                args: [wallet, i]
              });

              const tokenUri = await publicClient.readContract({
                address: contractAddr,
                abi: NFT_ABI,
                functionName: 'tokenURI',
                args: [tokenId]
              });

              // Fetch metadata
              let image = '/gan-logo.jpg';
              let nftName = `#${tokenId}`;
              
              if (tokenUri) {
                const metadataUrl = tokenUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                try {
                  const res = await fetch(metadataUrl);
                  const metadata = await res.json();
                  image = metadata.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/') || image;
                  nftName = metadata.name || nftName;
                } catch (e) {
                  console.log('Failed to fetch metadata:', e);
                }
              }

              nfts.push({
                id: `${contractAddr}-${tokenId}`,
                name: nftName,
                image,
                collection: name,
                tokenId: tokenId.toString(),
                contract: contractAddr,
                chain: 'optimism'
              });
            } catch (e) {
              console.log('Error fetching token:', e);
            }
          }
        }
      } catch (e) {
        console.log('Error checking collection:', contractAddr, e);
      }
    }

    return NextResponse.json({ nfts });
  } catch (e) {
    console.error('Error fetching user NFTs:', e);
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 });
  }
}
