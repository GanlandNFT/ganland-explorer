/**
 * Draft Manager - Client-side utilities for managing launch drafts
 * Handles local staging and Supabase sync for the launchpad
 */

const CHUNK_SIZE = 500 * 1024; // 500KB chunks for Vercel limits
const MAX_INLINE_SIZE = 100 * 1024; // 100KB - inline small files in draft_data

/**
 * Convert File to base64 data URL
 */
export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 data URL back to File
 */
export function dataUrlToFile(dataUrl, filename, type) {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = type || (mimeMatch ? mimeMatch[1] : 'application/octet-stream');
  
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new File([array], filename, { type: mime });
}

/**
 * Split large file into chunks for upload
 */
export function chunkFile(dataUrl) {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const chunks = [];
  
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    chunks.push(base64.slice(i, i + CHUNK_SIZE));
  }
  
  return chunks;
}

/**
 * Reassemble chunks back to data URL
 */
export function reassembleChunks(chunks, mimeType) {
  const base64 = chunks.join('');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Draft Manager Class
 */
export class DraftManager {
  constructor(apiBase = '/api/drafts') {
    this.apiBase = apiBase;
  }

  /**
   * Save draft to Supabase
   * @param {string} wallet - User wallet address
   * @param {Object} draftData - Form data (name, description, config, etc.)
   * @param {File[]} files - Staged files (images)
   * @returns {Promise<{success: boolean, draft: Object}>}
   */
  async saveDraft(wallet, draftData, files = []) {
    // Prepare staged files - small files inline, large files chunked
    const stagedFiles = [];
    const largeFileChunks = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await fileToDataUrl(file);
      
      if (file.size <= MAX_INLINE_SIZE) {
        // Small file - store inline
        stagedFiles.push({
          index: i,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        });
      } else {
        // Large file - mark as chunked, send chunks separately
        const chunks = chunkFile(dataUrl);
        stagedFiles.push({
          index: i,
          name: file.name,
          type: file.type,
          size: file.size,
          chunked: true,
          chunkCount: chunks.length,
        });
        
        largeFileChunks.push({
          fileIndex: i,
          chunks,
          type: file.type,
        });
      }
    }

    // Save main draft (with small files inline)
    const response = await fetch(this.apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet,
        draftData,
        stagedFiles,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save draft');
    }

    const result = await response.json();
    const draftId = result.draft.id;

    // Upload large file chunks sequentially
    for (const file of largeFileChunks) {
      for (let chunkIndex = 0; chunkIndex < file.chunks.length; chunkIndex++) {
        const chunkResponse = await fetch(`${this.apiBase}/chunks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId,
            fileIndex: file.fileIndex,
            chunkIndex,
            chunkData: file.chunks[chunkIndex],
          }),
        });

        if (!chunkResponse.ok) {
          console.error(`Failed to upload chunk ${chunkIndex} for file ${file.fileIndex}`);
        }
      }
    }

    return result;
  }

  /**
   * Load draft from Supabase
   * @param {string} wallet - User wallet address
   * @returns {Promise<{draft: Object, files: File[]} | null>}
   */
  async loadDraft(wallet) {
    const response = await fetch(`${this.apiBase}?wallet=${encodeURIComponent(wallet)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to load draft');
    }

    const { draft, chunks } = await response.json();
    
    if (!draft) return null;

    // Reconstruct files from staged data
    const files = [];
    const stagedFiles = draft.staged_files || [];

    for (const staged of stagedFiles) {
      if (staged.dataUrl) {
        // Inline file
        files.push(dataUrlToFile(staged.dataUrl, staged.name, staged.type));
      } else if (staged.chunked) {
        // Chunked file - reassemble
        const fileChunks = chunks
          .filter(c => c.file_index === staged.index)
          .sort((a, b) => a.chunk_index - b.chunk_index)
          .map(c => c.chunk_data);
        
        if (fileChunks.length === staged.chunkCount) {
          const dataUrl = reassembleChunks(fileChunks, staged.type);
          files.push(dataUrlToFile(dataUrl, staged.name, staged.type));
        } else {
          console.warn(`Missing chunks for file ${staged.name}`);
        }
      }
    }

    return {
      draft: draft.draft_data,
      files,
      updatedAt: draft.updated_at,
    };
  }

  /**
   * Delete draft from Supabase
   * @param {string} wallet - User wallet address
   * @returns {Promise<{success: boolean}>}
   */
  async deleteDraft(wallet) {
    const response = await fetch(`${this.apiBase}?wallet=${encodeURIComponent(wallet)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete draft');
    }

    return { success: true };
  }

  /**
   * Check if draft exists
   * @param {string} wallet - User wallet address
   * @returns {Promise<boolean>}
   */
  async hasDraft(wallet) {
    try {
      const response = await fetch(`${this.apiBase}/exists?wallet=${encodeURIComponent(wallet)}`);
      const { exists } = await response.json();
      return exists;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const draftManager = new DraftManager();

export default DraftManager;
