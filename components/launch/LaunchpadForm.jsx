'use client';

import { useState } from 'react';
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
    licenseVersion: licenseVersions.COMMERCIAL,
    tokenType: tokenTypes.ERC721,
    externalUrl: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
    
    // Clear error on change
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configure Your Collection</h2>
        <p className="text-gray-400">
          Set up the details for your NFT collection on Optimism
        </p>
      </div>

      {/* Token Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Token Standard
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tokenType: tokenTypes.ERC721 }))}
            className={`p-4 rounded-xl border-2 transition text-left ${
              formData.tokenType === tokenTypes.ERC721
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="font-bold mb-1">ERC-721</div>
            <div className="text-sm text-gray-400">
              Unique NFTs (1 of 1). Best for art collections, PFPs.
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, tokenType: tokenTypes.ERC1155 }))}
            className={`p-4 rounded-xl border-2 transition text-left ${
              formData.tokenType === tokenTypes.ERC1155
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="font-bold mb-1">ERC-1155</div>
            <div className="text-sm text-gray-400">
              Semi-fungible tokens. Best for editions, gaming items.
            </div>
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-6">
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
          rows={4}
          placeholder="Describe your collection..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Supply & Royalty */}
      <div className="grid grid-cols-2 gap-6">
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
            Royalty Fee
          </label>
          <div className="relative">
            <input
              type="number"
              name="royaltyFee"
              value={formData.royaltyFee / 100}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                royaltyFee: Math.round(parseFloat(e.target.value) * 100) || 0
              }))}
              min={0}
              max={10}
              step={0.1}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-12 ${
                errors.royaltyFee ? 'border-red-500' : 'border-gray-700'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
          {errors.royaltyFee && <p className="text-red-400 text-sm mt-1">{errors.royaltyFee}</p>}
        </div>
      </div>

      {/* License Version */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          License
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(licenseVersions).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, licenseVersion: value }))}
              className={`p-3 rounded-lg border transition text-left ${
                formData.licenseVersion === value
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-sm">{key.replace(/_/g, ' ')}</div>
              <div className="text-xs text-gray-500 mt-1">
                {LICENSE_DESCRIPTIONS[value]}
              </div>
            </button>
          ))}
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
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
        >
          ← Back
        </button>
        <button
          type="submit"
          className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
        >
          Continue →
        </button>
      </div>
    </form>
  );
}

export default LaunchpadForm;
