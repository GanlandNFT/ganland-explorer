'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { usePrivy } from '@privy-io/react-auth';
import { draftManager } from '@/lib/draft-manager';

export function CollectionUploader({ onComplete }) {
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address;

  const [files, setFiles] = useState([]);
  const [metadataFiles, setMetadataFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadMode, setUploadMode] = useState('images'); // 'images' or 'full'
  
  // Draft state
  const [hasDraft, setHasDraft] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    async function checkDraft() {
      if (!walletAddress) {
        setDraftLoading(false);
        return;
      }

      try {
        const exists = await draftManager.hasDraft(walletAddress);
        setHasDraft(exists);
        setShowDraftBanner(exists);
      } catch (e) {
        console.error('Failed to check draft:', e);
      } finally {
        setDraftLoading(false);
      }
    }

    checkDraft();
  }, [walletAddress]);

  // Load draft
  const handleLoadDraft = async () => {
    if (!walletAddress) return;
    
    setDraftLoading(true);
    try {
      const result = await draftManager.loadDraft(walletAddress);
      if (result) {
        setFiles(result.files || []);
        if (result.draft?.uploadMode) {
          setUploadMode(result.draft.uploadMode);
        }
        if (result.draft?.metadataFiles) {
          setMetadataFiles(result.draft.metadataFiles);
        }
        setDraftSavedAt(result.updatedAt);
        setShowDraftBanner(false);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
      setError('Failed to load draft');
    } finally {
      setDraftLoading(false);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!walletAddress || files.length === 0) return;

    setSavingDraft(true);
    setError(null);

    try {
      await draftManager.saveDraft(
        walletAddress,
        { 
          uploadMode,
          fileNames: files.map(f => f.name),
        },
        files
      );
      setHasDraft(true);
      setDraftSavedAt(new Date().toISOString());
    } catch (e) {
      console.error('Failed to save draft:', e);
      setError('Failed to save draft: ' + e.message);
    } finally {
      setSavingDraft(false);
    }
  };

  // Delete draft
  const handleDeleteDraft = async () => {
    if (!walletAddress) return;

    try {
      await draftManager.deleteDraft(walletAddress);
      setHasDraft(false);
      setShowDraftBanner(false);
      setFiles([]);
      setMetadataFiles([]);
      setDraftSavedAt(null);
    } catch (e) {
      console.error('Failed to delete draft:', e);
      setError('Failed to delete draft');
    }
  };

  // Image dropzone
  const onImageDrop = useCallback((acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    setFiles(prev => [...prev, ...imageFiles]);
    setDraftSavedAt(null); // Mark as unsaved
  }, []);

  // Metadata dropzone
  const onMetadataDrop = useCallback((acceptedFiles) => {
    const jsonFiles = acceptedFiles.filter(f => 
      f.name.endsWith('.json')
    );
    setMetadataFiles(prev => [...prev, ...jsonFiles]);
    setDraftSavedAt(null);
  }, []);

  const imageDropzone = useDropzone({
    onDrop: onImageDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.webm'],
    },
    multiple: true,
  });

  const metadataDropzone = useDropzone({
    onDrop: onMetadataDrop,
    accept: { 'application/json': ['.json'] },
    multiple: true,
  });

  const removeFile = (index, type) => {
    if (type === 'image') {
      setFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setMetadataFiles(prev => prev.filter((_, i) => i !== index));
    }
    setDraftSavedAt(null);
  };

  // Stage files locally and proceed (delayed IPFS upload)
  const handleContinue = () => {
    if (files.length === 0) {
      setError('Please add at least one image');
      return;
    }

    // Pass staged files to next step - IPFS upload happens at review/payment
    onComplete({
      stagedFiles: files,
      stagedMetadata: metadataFiles,
      uploadMode,
      totalFiles: files.length,
      // Flag that IPFS upload is pending
      ipfsPending: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Draft Resume Banner */}
      {showDraftBanner && !draftLoading && (
        <div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📂</span>
            <div>
              <p className="font-medium text-cyan-300">You have a saved draft</p>
              <p className="text-sm text-gray-400">Continue where you left off?</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleLoadDraft}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition"
            >
              Resume Draft
            </button>
            <button
              onClick={() => setShowDraftBanner(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition"
            >
              Start Fresh
            </button>
            <button
              onClick={handleDeleteDraft}
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg text-sm transition"
              title="Delete draft"
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {draftLoading && (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Checking for saved draft...</p>
        </div>
      )}

      {!draftLoading && (
        <>
          <div>
            <h2 className="text-2xl font-bold mb-2">Upload Your Collection</h2>
            <p className="text-gray-400">
              Add images for your NFT collection. Files are staged locally until you complete payment.
            </p>
          </div>

          {/* Upload Mode Toggle */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setUploadMode('images')}
              disabled={files.length > 0 || metadataFiles.length > 0}
              className={`px-4 py-2 rounded-lg transition ${
                uploadMode === 'images' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              } ${(files.length > 0 || metadataFiles.length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Images Only (Auto-generate metadata)
            </button>
            <button
              onClick={() => setUploadMode('full')}
              disabled={files.length > 0 || metadataFiles.length > 0}
              className={`px-4 py-2 rounded-lg transition ${
                uploadMode === 'full' 
                  ? 'bg-cyan-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              } ${(files.length > 0 || metadataFiles.length > 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Images + Custom Metadata
            </button>
            {(files.length > 0 || metadataFiles.length > 0) && (
              <button
                onClick={() => { setFiles([]); setMetadataFiles([]); setDraftSavedAt(null); }}
                className="px-4 py-2 bg-red-900/30 border border-red-700 text-red-400 hover:bg-red-900/50 hover:text-red-300 rounded-full text-sm transition"
              >
                ✕ Clear & Change Mode
              </button>
            )}
          </div>

          {/* Image Upload Zone */}
          <div
            {...imageDropzone.getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
              ${imageDropzone.isDragActive 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-gray-700 hover:border-gray-600'
              }
            `}
          >
            <input {...imageDropzone.getInputProps()} />
            <div className="text-4xl mb-4">📁</div>
            <p className="text-lg font-medium mb-2">
              {imageDropzone.isDragActive 
                ? 'Drop images here...' 
                : 'Drag & drop images or click to browse'
              }
            </p>
            <p className="text-gray-500 text-sm">
              Supports PNG, JPG, GIF, WEBP, SVG, MP4, WEBM
            </p>
          </div>

          {/* Metadata Upload Zone (if full mode) */}
          {uploadMode === 'full' && (
            <div
              {...metadataDropzone.getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition
                ${metadataDropzone.isDragActive 
                  ? 'border-purple-500 bg-purple-500/10' 
                  : 'border-gray-700 hover:border-gray-600'
                }
              `}
            >
              <input {...metadataDropzone.getInputProps()} />
              <div className="text-4xl mb-4">📋</div>
              <p className="text-lg font-medium mb-2">
                {metadataDropzone.isDragActive 
                  ? 'Drop JSON files here...' 
                  : 'Drag & drop metadata JSON files'
                }
              </p>
              <p className="text-gray-500 text-sm">
                Upload .json metadata files (1.json, 2.json, etc.)
              </p>
            </div>
          )}

          {/* File Preview */}
          {files.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">
                Images ({files.length})
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {files.slice(0, 12).map((file, i) => (
                  <div key={i} className="relative group">
                    <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎬
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(i, 'image')}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {files.length > 12 && (
                  <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">+{files.length - 12} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata Files Preview */}
          {uploadMode === 'full' && metadataFiles.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">
                Metadata Files ({metadataFiles.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {metadataFiles.map((file, i) => (
                  <div 
                    key={i}
                    className="px-3 py-1 bg-gray-800 rounded-full text-sm flex items-center gap-2"
                  >
                    <span>{file.name}</span>
                    <button
                      onClick={() => removeFile(i, 'metadata')}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Progress */}
          {isUploading && (
            <div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-gray-400 mt-2">
                Uploading to IPFS... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Draft Status & Save */}
          {files.length > 0 && walletAddress && (
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400">
                {draftSavedAt ? (
                  <span className="text-green-400">
                    ✓ Draft saved {new Date(draftSavedAt).toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="text-yellow-400">
                    ⚠ Unsaved changes
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft || draftSavedAt}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  savingDraft || draftSavedAt
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {savingDraft ? 'Saving...' : draftSavedAt ? 'Draft Saved' : '💾 Save Draft'}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              💡 Files stay local until you complete payment in step 3
            </p>
            <button
              onClick={handleContinue}
              disabled={files.length === 0 || isUploading}
              className={`
                px-8 py-3 rounded-lg font-medium transition
                ${files.length === 0 || isUploading
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }
              `}
            >
              Continue to Configure →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CollectionUploader;
