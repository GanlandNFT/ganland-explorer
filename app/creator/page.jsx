'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, isAddress } from 'viem';
import { optimism } from 'viem/chains';
import { normalize } from 'viem/ens';
import { BrowserProvider, Contract } from 'ethers';
import { useGanWallet } from '@/hooks/useGanWallet';

// Launchpad contract to get user's collections
const LAUNCHPAD_ADDRESS = '0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed';

const LAUNCHPAD_ABI = [
  {
    name: 'getERC721sByCreator',
    type: 'function',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view'
  },
  {
    name: 'getERC1155sByCreator', 
    type: 'function',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view'
  }
];

// Minimal NFT ABI for collection info and admin functions
const NFT_ABI = [
  { name: 'name', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'symbol', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'owner', type: 'function', inputs: [], outputs: [{ type: 'address' }], stateMutability: 'view' },
  { name: 'contractURI', type: 'function', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
  { name: 'totalSupply', type: 'function', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { 
    name: 'transferOwnership', 
    type: 'function', 
    inputs: [{ name: 'newOwner', type: 'address' }], 
    outputs: [], 
    stateMutability: 'nonpayable' 
  },
  {
    name: 'mint',
    type: 'function',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    name: 'batchMint',
    type: 'function',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'startId', type: 'uint256' }],
    stateMutability: 'nonpayable'
  }
];

const publicClient = createPublicClient({
  chain: optimism,
  transport: http()
});

// Mainnet client for ENS resolution
const mainnetClient = createPublicClient({
  chain: { id: 1, name: 'Ethereum', network: 'homestead', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } } },
  transport: http()
});

export default function CreatorDashboard() {
  const { login } = usePrivy();
  const { ready, authenticated, address, wallet } = useGanWallet();
  
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState(null);
  
  // Modal states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [adminAddress, setAdminAddress] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user's collections
  useEffect(() => {
    const fetchCollections = async () => {
      if (!address) {
        setCollections([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Get ERC721 collections
        const erc721s = await publicClient.readContract({
          address: LAUNCHPAD_ADDRESS,
          abi: LAUNCHPAD_ABI,
          functionName: 'getERC721sByCreator',
          args: [address]
        });

        // Get ERC1155 collections
        const erc1155s = await publicClient.readContract({
          address: LAUNCHPAD_ADDRESS,
          abi: LAUNCHPAD_ABI,
          functionName: 'getERC1155sByCreator',
          args: [address]
        });

        // Fetch details for each collection
        const allCollections = [...erc721s, ...erc1155s];
        const collectionDetails = await Promise.all(
          allCollections.map(async (addr) => {
            try {
              const [name, symbol, owner, totalSupply] = await Promise.all([
                publicClient.readContract({ address: addr, abi: NFT_ABI, functionName: 'name' }),
                publicClient.readContract({ address: addr, abi: NFT_ABI, functionName: 'symbol' }),
                publicClient.readContract({ address: addr, abi: NFT_ABI, functionName: 'owner' }),
                publicClient.readContract({ address: addr, abi: NFT_ABI, functionName: 'totalSupply' }).catch(() => 0n)
              ]);
              
              // Try to get avatar - first from our API, then from contractURI
              let avatar = null;
              try {
                // 1. Try our Supabase API first
                const avatarRes = await fetch(`/api/collection-avatar?address=${addr}`);
                const avatarData = await avatarRes.json();
                if (avatarData.avatar) {
                  avatar = avatarData.avatar;
                } else {
                  // 2. Fallback: try contractURI
                  const contractUri = await publicClient.readContract({ address: addr, abi: NFT_ABI, functionName: 'contractURI' });
                  if (contractUri) {
                    const metadataUrl = contractUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                    const res = await fetch(metadataUrl);
                    const metadata = await res.json();
                    avatar = metadata.image?.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
                  }
                }
              } catch (e) {
                console.log('No avatar found for', addr);
              }

              return {
                address: addr,
                name,
                symbol,
                owner,
                totalSupply: Number(totalSupply),
                avatar,
                isOwner: owner.toLowerCase() === address.toLowerCase()
              };
            } catch (e) {
              console.error('Error fetching collection', addr, e);
              return null;
            }
          })
        );

        setCollections(collectionDetails.filter(Boolean));
      } catch (e) {
        console.error('Error fetching collections:', e);
      }
      setLoading(false);
    };

    fetchCollections();
  }, [address]);

  // Resolve address (0x, ENS, or @handle)
  const resolveAddress = async (input) => {
    if (!input) throw new Error('Address required');
    
    // Already a valid address
    if (isAddress(input)) return input;
    
    // ENS name
    if (input.endsWith('.eth')) {
      const resolved = await mainnetClient.getEnsAddress({ name: normalize(input) });
      if (!resolved) throw new Error(`Could not resolve ENS: ${input}`);
      return resolved;
    }
    
    // @handle - look up in Ganland
    if (input.startsWith('@')) {
      const handle = input.slice(1);
      const res = await fetch(`/api/resolve-handle?handle=${encodeURIComponent(handle)}`);
      if (!res.ok) throw new Error(`Could not resolve @${handle}`);
      const data = await res.json();
      if (!data.address) throw new Error(`No wallet found for @${handle}`);
      return data.address;
    }
    
    throw new Error('Invalid address format. Use 0x..., name.eth, or @handle');
  };

  // Transfer ownership
  const handleTransferAdmin = async () => {
    if (!selectedCollection || !adminAddress || !wallet) return;
    
    setIsProcessing(true);
    setError(null);
    setTxResult(null);
    
    try {
      const toAddress = await resolveAddress(adminAddress);
      
      await wallet.switchChain(optimism.id);
      const provider = new BrowserProvider(await wallet.getEthereumProvider());
      const signer = await provider.getSigner();
      
      const contract = new Contract(selectedCollection.address, NFT_ABI, signer);
      const tx = await contract.transferOwnership(toAddress);
      
      setTxResult({ hash: tx.hash, type: 'admin' });
      await tx.wait();
      
      // Update local state
      setCollections(prev => prev.map(c => 
        c.address === selectedCollection.address 
          ? { ...c, owner: toAddress, isOwner: false }
          : c
      ));
      
      setShowAdminModal(false);
      setAdminAddress('');
    } catch (e) {
      console.error('Transfer failed:', e);
      setError(e.message || 'Transfer failed');
    }
    setIsProcessing(false);
  };

  // Mint NFT
  const handleMint = async () => {
    if (!selectedCollection || !mintAddress || !wallet) return;
    
    setIsProcessing(true);
    setError(null);
    setTxResult(null);
    
    try {
      const toAddress = await resolveAddress(mintAddress);
      
      await wallet.switchChain(optimism.id);
      const provider = new BrowserProvider(await wallet.getEthereumProvider());
      const signer = await provider.getSigner();
      
      const contract = new Contract(selectedCollection.address, NFT_ABI, signer);
      
      // Use mint(address) function
      const tx = await contract.mint(toAddress);
      
      setTxResult({ hash: tx.hash, type: 'mint' });
      await tx.wait();
      
      // Update supply
      setCollections(prev => prev.map(c => 
        c.address === selectedCollection.address 
          ? { ...c, totalSupply: c.totalSupply + 1 }
          : c
      ));
      
      setShowMintModal(false);
      setMintAddress('');
      
    } catch (e) {
      console.error('Mint failed:', e);
      setError(e.message || 'Mint failed');
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 py-6 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Creator Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Manage your NFT collections on Optimism</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-8">
        {/* Not authenticated */}
        {ready && !authenticated && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-bold mb-4">Connect to View Your Collections</h2>
            <p className="text-gray-400 mb-6">Sign in to manage your deployed NFT collections.</p>
            <button
              onClick={login}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {/* Loading */}
        {ready && authenticated && loading && (
          <div className="text-center py-16">
            <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading your collections...</p>
          </div>
        )}

        {/* No collections */}
        {ready && authenticated && !loading && collections.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📦</div>
            <h2 className="text-2xl font-bold mb-4">No Collections Found</h2>
            <p className="text-gray-400 mb-6">You haven't deployed any collections yet.</p>
            <a
              href="/launch"
              className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
            >
              Launch Your First Collection →
            </a>
          </div>
        )}

        {/* Collections Grid */}
        {ready && authenticated && !loading && collections.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <div
                key={collection.address}
                className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-cyan-500/50 transition"
              >
                {/* Collection Header with Avatar */}
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center gap-4">
                    {collection.avatar ? (
                      <img 
                        src={collection.avatar} 
                        alt={collection.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-gray-700"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
                        {collection.symbol?.slice(0, 2) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">{collection.name}</h3>
                      <p className="text-gray-400 text-sm">{collection.symbol}</p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="p-4 bg-gray-800/30">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Minted</span>
                    <span className="font-medium">{collection.totalSupply}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 space-y-3">
                  {/* Etherscan Link */}
                  <a
                    href={`https://optimistic.etherscan.io/address/${collection.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                  >
                    <span>View on Etherscan</span>
                    <span className="text-cyan-400">↗</span>
                  </a>

                  {/* Admin Actions - Only if owner */}
                  {collection.isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowAdminModal(true);
                        }}
                        className="w-full px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-400 rounded-lg text-sm font-medium transition"
                      >
                        👑 Add Admin
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowMintModal(true);
                        }}
                        className="w-full px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-400 rounded-lg text-sm font-medium transition"
                      >
                        🎨 Mint NFT
                      </button>
                    </>
                  )}

                  {!collection.isOwner && (
                    <p className="text-center text-gray-500 text-sm py-2">
                      Admin transferred to another wallet
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Launch more CTA */}
        {ready && authenticated && !loading && collections.length > 0 && (
          <div className="mt-12 text-center">
            <a
              href="/launch"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
            >
              <span>🚀</span>
              <span>Launch Another Collection</span>
            </a>
          </div>
        )}
      </main>

      {/* Add Admin Modal */}
      {showAdminModal && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Transfer Admin Rights</h2>
            <p className="text-gray-400 text-sm mb-4">
              Transfer ownership of <strong>{selectedCollection.name}</strong> to another wallet.
              This action cannot be undone.
            </p>
            
            <input
              type="text"
              value={adminAddress}
              onChange={(e) => setAdminAddress(e.target.value)}
              placeholder="0x..., name.eth, or @handle"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />
            
            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}
            
            {txResult && (
              <p className="text-green-400 text-sm mb-4">
                ✓ Transaction sent!{' '}
                <a href={`https://optimistic.etherscan.io/tx/${txResult.hash}`} target="_blank" className="underline">
                  View
                </a>
              </p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAdminModal(false);
                  setAdminAddress('');
                  setError(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferAdmin}
                disabled={isProcessing || !adminAddress}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
              >
                {isProcessing ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mint Modal */}
      {showMintModal && selectedCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Mint NFT</h2>
            <p className="text-gray-400 text-sm mb-4">
              Mint the next token from <strong>{selectedCollection.name}</strong> to any wallet. Token ID will be automatically assigned.
            </p>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Recipient</label>
                <input
                  type="text"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  placeholder="0x..., name.eth, or @handle"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              
              {/* Token URI not needed - metadata is from baseURI + tokenId */}
            </div>
            
            {error && (
              <p className="text-red-400 text-sm mb-4">{error}</p>
            )}
            
            {txResult && (
              <p className="text-green-400 text-sm mb-4">
                ✓ Minted!{' '}
                <a href={`https://optimistic.etherscan.io/tx/${txResult.hash}`} target="_blank" className="underline">
                  View transaction
                </a>
              </p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMintModal(false);
                  setMintAddress('');
                  
                  setError(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                disabled={isProcessing || !mintAddress}
                className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition"
              >
                {isProcessing ? 'Minting...' : 'Mint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 px-8 mt-12">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p>Powered by Fractal Visions • Built on Optimism</p>
        </div>
      </footer>
    </div>
  );
}
