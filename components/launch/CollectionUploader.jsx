'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PinataClient } from '@/lib/pinata';

export function CollectionUploader({ onComplete }) {
  const [files, setFiles] = useState([]);
  const [metadataFiles, setMetadataFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadMode, setUploadMode] = useState('images'); // 'images' or 'full'

  // Image dropzone
  const onImageDrop = useCallback((acceptedFiles) => {
    const imageFiles = acceptedFiles.filter(f => 
      f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    setFiles(prev => [...prev, ...imageFiles]);
  }, []);

  // Metadata dropzone
  const onMetadataDrop = useCallback((acceptedFiles) => {
    const jsonFiles = acceptedFiles.filter(f => 
      f.name.endsWith('.json')
    );
    setMetadataFiles(prev => [...prev, ...jsonFiles]);
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
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please add at least one image');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Check for Pinata credentials
      const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
      
      if (!apiKey || !secretKey) {
        throw new Error(
          'Pinata API keys not configured. Please contact support or check your environment variables.'
        );
      }
      
      const pinata = new PinataClient(apiKey, secretKey);

      let result;

      if (uploadMode === 'full' && metadataFiles.length > 0) {
        // User provided their own metadata - just upload both folders
        setUploadProgress(20);
        
        const imagesResult = await pinata.uploadFolder(files, 'images');
        setUploadProgress(60);
        
        const metadataResult = await pinata.uploadFolder(metadataFiles, 'metadata');
        setUploadProgress(100);

        result = {
          imagesHash: imagesResult.ipfsHash,
          metadataHash: metadataResult.ipfsHash,
          baseURI: `ipfs://${metadataResult.ipfsHash}/metadata/`,
          totalFiles: files.length,
        };
      } else {
        // Generate metadata from images
        const collectionName = `collection-${Date.now()}`;
        
        setUploadProgress(10);
        result = await pinata.bulkUploadCollection({
          imageFiles: files,
          collectionName,
          description: '', // Will be set in next step
        });
        setUploadProgress(100);
      }

      onComplete({
        ...result,
        files: files.map(f => ({ name: f.name, type: f.type, size: f.size })),
        hasCustomMetadata: uploadMode === 'full' && metadataFiles.length > 0,
      });

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Your Collection</h2>
        <p className="text-gray-400">
          Upload images/media for your NFT collection. We'll pin them to IPFS via Pinata.
        </p>
      </div>

      {/* Upload Mode Toggle - disabled once files are added */}
      <div className="flex gap-4">
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
            onClick={() => { setFiles([]); setMetadataFiles([]); }}
            className="px-3 py-2 text-red-400 hover:text-red-300 text-sm"
          >
            Clear & Change Mode
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
          <div className="grid grid-cols-6 gap-3">
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

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || isUploading}
          className={`
            px-8 py-3 rounded-lg font-medium transition
            ${files.length === 0 || isUploading
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }
          `}
        >
          {isUploading ? 'Uploading...' : 'Upload to IPFS'}
        </button>
      </div>
    </div>
  );
}

export default CollectionUploader;
