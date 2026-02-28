'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export function MyCollections({ collections }) {
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address;
  
  const [activeTab, setActiveTab] = useState('erc721');
  const [showIpfsManager, setShowIpfsManager] = useState(false);
  const [trackedPins, setTrackedPins] = useState([]);
  const [loadingPins, setLoadingPins] = useState(false);
  const [unpinning, setUnpinning] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);

  const activeCollections = activeTab === 'erc721' 
    ? collections.erc721 
    : collections.erc1155;

  // Load tracked IPFS pins
  useEffect(() => {
    if (showIpfsManager && walletAddress) {
      loadTrackedPins();
    }
  }, [showIpfsManager, walletAddress]);

  const loadTrackedPins = async () => {
    if (!walletAddress) return;
    
    setLoadingPins(true);
    try {
      const response = await fetch(`/api/ipfs/pins?wallet=${encodeURIComponent(walletAddress)}`);
      const data = await response.json();
      setTrackedPins(data.tracked || []);
    } catch (e) {
      console.error('Failed to load pins:', e);
    } finally {
      setLoadingPins(false);
    }
  };

  const handleUnpin = async (cid) => {
    if (!confirm(`Are you sure you want to unpin ${cid.slice(0, 12)}...? This will remove the files from IPFS.`)) {
      return;
    }

    setUnpinning(cid);
    try {
      const response = await fetch('/api/ipfs/unpin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cid, wallet: walletAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to unpin');
      }

      // Reload pins
      await loadTrackedPins();
    } catch (e) {
      console.error('Unpin failed:', e);
      alert('Failed to unpin: ' + e.message);
    } finally {
      setUnpinning(null);
    }
  };

  const handleUpdateCid = async (collectionAddress, newCid) => {
    try {
      const response = await fetch('/api/ipfs/track', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: walletAddress,
          collectionAddress,
          newMetadataCid: newCid,
          newBaseUri: `ipfs://${newCid}/`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update');
      }

      setUpdateModal(null);
      await loadTrackedPins();
    } catch (e) {
      console.error('Update failed:', e);
      alert('Failed to update CID: ' + e.message);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">My Collections</h2>
        <button
          onClick={() => setShowIpfsManager(!showIpfsManager)}
          className={`px-4 py-2 rounded-lg text-sm transition ${
            showIpfsManager 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {showIpfsManager ? '← Back to Collections' : '⚙️ Manage IPFS'}
        </button>
      </div>
      
      {/* IPFS Manager View */}
      {showIpfsManager ? (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Manage your pinned IPFS content. You can unpin files or update CIDs for deployed collections.
          </p>

          {loadingPins ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading IPFS data...</p>
            </div>
          ) : trackedPins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-3">📦</p>
              <p>No tracked IPFS pins yet</p>
              <p className="text-sm mt-1">Deploy a collection to see your IPFS content here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trackedPins.map((pin) => (
                <div 
                  key={pin.id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {pin.collection_address && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">Collection:</span>
                          <a
                            href={`https://optimistic.etherscan.io/address/${pin.collection_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-400 hover:underline font-mono"
                          >
                            {pin.collection_address.slice(0, 8)}...{pin.collection_address.slice(-6)}
                          </a>
                        </div>
                      )}
                      
                      {pin.images_cid && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 w-16">Images:</span>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${pin.images_cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-300 hover:text-white font-mono truncate"
                          >
                            {pin.images_cid}
                          </a>
                          <button
                            onClick={() => handleUnpin(pin.images_cid)}
                            disabled={unpinning === pin.images_cid}
                            className="text-xs text-red-400 hover:text-red-300 shrink-0"
                          >
                            {unpinning === pin.images_cid ? '...' : '🗑️'}
                          </button>
                        </div>
                      )}
                      
                      {pin.metadata_cid && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-16">Metadata:</span>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${pin.metadata_cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-300 hover:text-white font-mono truncate"
                          >
                            {pin.metadata_cid}
                          </a>
                          <button
                            onClick={() => handleUnpin(pin.metadata_cid)}
                            disabled={unpinning === pin.metadata_cid}
                            className="text-xs text-red-400 hover:text-red-300 shrink-0"
                          >
                            {unpinning === pin.metadata_cid ? '...' : '🗑️'}
                          </button>
                        </div>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Pinned: {new Date(pin.pinned_at).toLocaleDateString()}
                        {pin.status !== 'active' && (
                          <span className="ml-2 text-yellow-500">({pin.status})</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {pin.collection_address && (
                        <button
                          onClick={() => setUpdateModal(pin)}
                          className="px-3 py-1 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded text-xs"
                        >
                          Update CID
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Update CID Modal */}
          {updateModal && (
            <UpdateCidModal
              pin={updateModal}
              onClose={() => setUpdateModal(null)}
              onUpdate={handleUpdateCid}
            />
          )}
        </div>
      ) : (
        /* Collections View */
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('erc721')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                activeTab === 'erc721'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              ERC-721 ({collections.erc721.length})
            </button>
            <button
              onClick={() => setActiveTab('erc1155')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                activeTab === 'erc1155'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              ERC-1155 ({collections.erc1155.length})
            </button>
          </div>

          {/* Collection Grid */}
          {activeCollections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No {activeTab.toUpperCase()} collections yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {activeCollections.map((address, i) => (
                <CollectionCard key={address} address={address} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CollectionCard({ address, index }) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <a
      href={`https://optimistic.etherscan.io/address/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition group"
    >
      <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center text-3xl">
        🎨
      </div>
      <p className="font-mono text-sm text-gray-400 group-hover:text-cyan-400 transition">
        {shortAddress}
      </p>
    </a>
  );
}

function UpdateCidModal({ pin, onClose, onUpdate }) {
  const [newCid, setNewCid] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCid.trim()) return;

    setUpdating(true);
    await onUpdate(pin.collection_address, newCid.trim());
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700">
        <h3 className="text-xl font-bold mb-4">Update Metadata CID</h3>
        <p className="text-gray-400 text-sm mb-4">
          Enter a new IPFS CID to update the metadata location for this collection.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Current CID</label>
            <p className="font-mono text-sm text-gray-500 break-all">{pin.metadata_cid || 'Not set'}</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-1">New CID</label>
            <input
              type="text"
              value={newCid}
              onChange={(e) => setNewCid(e.target.value)}
              placeholder="Qm... or bafy..."
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newCid.trim() || updating}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition"
            >
              {updating ? 'Updating...' : 'Update CID'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          ⚠️ This only updates tracking in Supabase. To update the on-chain baseURI, 
          you'll need to call setBaseURI on your contract if supported.
        </p>
      </div>
    </div>
  );
}

export default MyCollections;
