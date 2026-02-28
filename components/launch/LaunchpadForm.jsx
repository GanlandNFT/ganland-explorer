'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { LICENSE_DESCRIPTIONS } from '@/lib/contracts/addresses';

export function LaunchpadForm({ 
  uploadedData, 
  onComplete, 
  onBack, 
  tokenTypes, 
  licenseVersions 
}) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    maxSupply: uploadedData?.totalFiles || 100,
    royaltyFee: 500, // 5% default
    licenseVersion: licenseVersions.COMMERCIAL || 2,
    tokenType: tokenTypes.ERC721,
    externalUrl: '',
    avatarFile: null,
    avatarPreview: null,
  });

  const [errors, setErrors] = useState({});

  // Avatar dropzone
  const onAvatarDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      }));
    }
  }, []);

  const avatarDropzone = useDropzone({
    onDrop: onAvatarDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    }
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required';
    } else if (formData.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }
    
    if (formData.maxSupply < 1) {
      newErrors.maxSupply = 'Max supply must be at least 1';
    }
    
    if (formData.royaltyFee < 0 || formData.royaltyFee > 1000) {
      newErrors.royaltyFee = 'Royalty must be between 0% and 10%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onComplete(formData);
    }
  };

  // Group licenses for better UX
  const standardLicenses = ['CC0', 'PERSONAL_USE', 'COMMERCIAL', 'COMMERCIAL_NO_HATE', 'EXCLUSIVE'];
  const cbeLicenses = ['CBE_CC0', 'CBE_NECR', 'CBE_NECR_HS', 'CBE_ECR', 'CBE_PR', 'CBE_PR_HS'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Configure Your Collection</h2>
        <p className="text-gray-400 text-sm sm:text-base">
          Set up the details for your NFT collection on Optimism
        </p>
      </div>

      {/* Collection Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Collection Avatar
        </label>
        <div className="flex items-start gap-4">
          <div
            {...avatarDropzone.getRootProps()}
            className={`
              w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-dashed cursor-pointer
              flex items-center justify-center overflow-hidden transition
              ${avatarDropzone.isDragActive 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-gray-700 hover:border-gray-500'
              }
            `}
          >
            <input {...avatarDropzone.getInputProps()} />
            {formData.avatarPreview ? (
              <img 
                src={formData.avatarPreview} 
                alt="Avatar preview" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <div className="text-2xl mb-1">📷</div>
                <p className="text-xs text-gray-500">Upload</p>
              </div>
            )}
          </div>
          <div className="flex-1 text-sm text-gray-400">
            <p>Square image recommended (will be cropped to circle)</p>
            <p className="text-gray-500 mt-1">PNG, JPG, GIF, WEBP • Max 5MB</p>
            {formData.avatarFile && (
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, avatarFile: null, avatarPreview: null }))}
                className="mt-2 text-red-400 hover:text-red-300 text-xs"
              >
                Remove avatar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Token Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Token Standard
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tokenType: tokenTypes.ERC721 }))}
            className={`p-3 sm:p-4 rounded-xl border-2 transition text-left ${
              formData.tokenType === tokenTypes.ERC721
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="font-bold mb-1">ERC-721</div>
            <div className="text-xs sm:text-sm text-gray-400">
              Unique NFTs (1 of 1). Art, PFPs.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tokenType: tokenTypes.ERC1155 }))}
            className={`p-3 sm:p-4 rounded-xl border-2 transition text-left ${
              formData.tokenType === tokenTypes.ERC1155
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="font-bold mb-1">ERC-1155</div>
            <div className="text-xs sm:text-sm text-gray-400">
              Semi-fungible. Editions, gaming.
            </div>
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Collection Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="My Amazing Collection"
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              errors.name ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Symbol *
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="MAC"
            maxLength={10}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase ${
              errors.symbol ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.symbol && <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Describe your collection..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Supply & Royalty */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Supply
          </label>
          <input
            type="number"
            name="maxSupply"
            value={formData.maxSupply}
            onChange={handleChange}
            min={1}
            className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
              errors.maxSupply ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {errors.maxSupply && <p className="text-red-400 text-sm mt-1">{errors.maxSupply}</p>}
          <p className="text-gray-500 text-sm mt-1">
            {uploadedData?.totalFiles} files uploaded
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Royalty Fee (max 10%)
          </label>
          <div className="relative">
            <input
              type="number"
              name="royaltyFee"
              value={formData.royaltyFee / 100}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                royaltyFee: Math.min(Math.round(parseFloat(e.target.value) * 100) || 0, 1000)
              }))}
              min={0}
              max={10}
              step={0.5}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-12 ${
                errors.royaltyFee ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
          {errors.royaltyFee && <p className="text-red-400 text-sm mt-1">{errors.royaltyFee}</p>}
        </div>
      </div>

      {/* License Version - Expandable sections */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          IP License
        </label>
        
        {/* Standard Licenses */}
        <p className="text-xs text-gray-500 mb-2">Standard Licenses</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {standardLicenses.map((key) => {
            const value = licenseVersions[key];
            if (value === undefined) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, licenseVersion: value }))}
                className={`p-2 sm:p-3 rounded-lg border transition text-left text-xs sm:text-sm ${
                  formData.licenseVersion === value
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">{key.replace(/_/g, ' ')}</div>
                <div className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                  {LICENSE_DESCRIPTIONS[value]?.split(' - ')[1] || LICENSE_DESCRIPTIONS[value]}
                </div>
              </button>
            );
          })}
        </div>

        {/* CBE Licenses */}
        <p className="text-xs text-gray-500 mb-2">Can't Be Evil (a]labs) Licenses</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cbeLicenses.map((key) => {
            const value = licenseVersions[key];
            if (value === undefined) return null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, licenseVersion: value }))}
                className={`p-2 sm:p-3 rounded-lg border transition text-left text-xs sm:text-sm ${
                  formData.licenseVersion === value
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="font-medium">{key.replace(/_/g, '-')}</div>
                <div className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                  {LICENSE_DESCRIPTIONS[value]?.split('(')[1]?.replace(')', '') || LICENSE_DESCRIPTIONS[value]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* External URL */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          External URL (Optional)
        </label>
        <input
          type="url"
          name="externalUrl"
          value={formData.externalUrl}
          onChange={handleChange}
          placeholder="https://your-website.com"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 sm:px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="px-6 sm:px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}

export default LaunchpadForm;
