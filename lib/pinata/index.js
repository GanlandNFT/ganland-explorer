/**
 * Pinata IPFS Integration for Launchpad
 * Handles bulk uploads of images and metadata
 */

const PINATA_API_URL = 'https://api.pinata.cloud';

export class PinataClient {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  get headers() {
    return {
      'pinata_api_key': this.apiKey,
      'pinata_secret_api_key': this.secretKey,
    };
  }

  /**
   * Upload a single file to IPFS
   * @param {File|Blob} file - The file to upload
   * @param {string} name - File name
   * @returns {Promise<{ipfsHash: string, pinSize: number}>}
   */
  async uploadFile(file, name) {
    const formData = new FormData();
    formData.append('file', file, name);
    
    const metadata = JSON.stringify({ name });
    formData.append('pinataMetadata', metadata);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: this.headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata upload failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload JSON metadata to IPFS
   * @param {Object} json - JSON object to upload
   * @param {string} name - Metadata name
   * @returns {Promise<{ipfsHash: string}>}
   */
  async uploadJSON(json, name) {
    const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: json,
        pinataMetadata: { name },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata JSON upload failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Upload a folder of files to IPFS (bulk upload)
   * @param {FileList|File[]} files - Array of files
   * @param {string} folderName - Name for the folder
   * @returns {Promise<{ipfsHash: string, files: Array}>}
   */
  async uploadFolder(files, folderName) {
    const formData = new FormData();
    
    for (const file of files) {
      // Pinata expects path format: folderName/fileName
      formData.append('file', file, `${folderName}/${file.name}`);
    }

    const metadata = JSON.stringify({ name: folderName });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({ wrapWithDirectory: true });
    formData.append('pinataOptions', options);

    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: this.headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Pinata folder upload failed: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    return {
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      folderName,
      fileCount: files.length,
    };
  }

  /**
   * Generate and upload metadata for a collection
   * @param {Object} params - Collection parameters
   * @returns {Promise<{baseURI: string, metadataHashes: string[]}>}
   */
  async uploadCollectionMetadata({
    name,
    description,
    imageHashes, // Array of IPFS hashes for images
    attributes = [], // Optional: shared attributes
    externalUrl = '',
  }) {
    const metadataFiles = [];
    
    for (let i = 0; i < imageHashes.length; i++) {
      const tokenId = i + 1;
      const metadata = {
        name: `${name} #${tokenId}`,
        description,
        image: `ipfs://${imageHashes[i]}`,
        external_url: externalUrl,
        attributes: attributes[i] || [],
      };
      
      const result = await this.uploadJSON(metadata, `${name}-${tokenId}.json`);
      metadataFiles.push(result.IpfsHash);
    }

    // For ERC721, we typically want a folder structure
    // baseURI should point to a folder where {tokenId}.json files live
    return {
      metadataHashes: metadataFiles,
      // If using individual files, you'll need to handle baseURI differently
    };
  }

  /**
   * Bulk upload images and generate matching metadata
   * @param {FileList|File[]} imageFiles - Image files
   * @param {Object} collectionInfo - Collection metadata
   * @returns {Promise<{imagesHash: string, metadataHash: string, baseURI: string}>}
   */
  async bulkUploadCollection({
    imageFiles,
    collectionName,
    description,
    externalUrl = '',
    attributes = [], // Array of attribute arrays per token
  }) {
    // 1. Upload all images as a folder
    const imagesResult = await this.uploadFolder(imageFiles, `${collectionName}-images`);
    
    // 2. Generate metadata for each image
    const metadataArray = [];
    const sortedFiles = Array.from(imageFiles).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true })
    );

    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      const tokenId = i + 1; // Or extract from filename
      
      metadataArray.push({
        name: `${collectionName} #${tokenId}`,
        description,
        image: `ipfs://${imagesResult.ipfsHash}/${collectionName}-images/${file.name}`,
        external_url: externalUrl ? `${externalUrl}/${tokenId}` : '',
        attributes: attributes[i] || [],
      });
    }

    // 3. Upload metadata files as a folder
    const metadataBlobs = metadataArray.map((m, i) => 
      new Blob([JSON.stringify(m, null, 2)], { type: 'application/json' })
    );
    
    // Create File objects from blobs
    const metadataFiles = metadataBlobs.map((blob, i) => 
      new File([blob], `${i + 1}.json`, { type: 'application/json' })
    );

    const metadataResult = await this.uploadFolder(metadataFiles, `${collectionName}-metadata`);

    return {
      imagesHash: imagesResult.ipfsHash,
      metadataHash: metadataResult.ipfsHash,
      baseURI: `ipfs://${metadataResult.ipfsHash}/${collectionName}-metadata/`,
      totalFiles: imageFiles.length,
    };
  }

  /**
   * Get gateway URL for an IPFS hash
   * @param {string} hash - IPFS hash
   * @returns {string}
   */
  static getGatewayUrl(hash, gateway = 'https://gateway.pinata.cloud/ipfs/') {
    return `${gateway}${hash}`;
  }
}

/**
   * Unpin a file from IPFS
   * @param {string} ipfsHash - The IPFS hash (CID) to unpin
   * @returns {Promise<{success: boolean}>}
   */
  async unpinFile(ipfsHash) {
    const response = await fetch(`${PINATA_API_URL}/pinning/unpin/${ipfsHash}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      // 404 means already unpinned, which is fine
      if (response.status === 404) {
        return { success: true, alreadyUnpinned: true };
      }
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Pinata unpin failed: ${error.message || response.statusText}`);
    }

    return { success: true };
  }

  /**
   * List pinned files with optional filters
   * @param {Object} options - Filter options
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async listPins({ status = 'pinned', pageLimit = 100, pageOffset = 0, nameContains = '' } = {}) {
    const params = new URLSearchParams({
      status,
      pageLimit: pageLimit.toString(),
      pageOffset: pageOffset.toString(),
    });
    
    if (nameContains) {
      params.append('metadata[name]', nameContains);
    }

    const response = await fetch(`${PINATA_API_URL}/data/pinList?${params}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`Pinata list failed: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get pin details by hash
   * @param {string} ipfsHash - The IPFS hash to look up
   * @returns {Promise<Object|null>}
   */
  async getPinByHash(ipfsHash) {
    const params = new URLSearchParams({
      status: 'pinned',
      hashContains: ipfsHash,
    });

    const response = await fetch(`${PINATA_API_URL}/data/pinList?${params}`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.rows?.find(pin => pin.ipfs_pin_hash === ipfsHash) || null;
  }
}

export default PinataClient;
