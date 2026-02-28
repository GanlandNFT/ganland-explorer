/**
 * Draft Manager for GAN Launchpad
 * Handles saving/loading draft collections with Supabase
 * Stages files locally before IPFS pinning
 */

import { supabase } from './supabase';

const CHUNK_SIZE = 400 * 1024; // 400KB chunks (safe for Vercel)

/**
 * Convert file to base64 chunks
 * @param {File} file - The file to chunk
 * @returns {Promise<string[]>} - Array of base64 chunks
 */
async function fileToChunks(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunks = [];
  
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.slice(i, i + CHUNK_SIZE);
    const base64 = btoa(String.fromCharCode(...chunk));
    chunks.push(base64);
  }
  
  return chunks;
}

/**
 * Reassemble file from base64 chunks
 * @param {string[]} chunks - Array of base64 chunks
 * @param {string} name - File name
 * @param {string} type - MIME type
 * @returns {File}
 */
function chunksToFile(chunks, name, type) {
  const combined = chunks.map(chunk => {
    const binary = atob(chunk);
    return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)));
  });
  
  const totalLength = combined.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of combined) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return new File([result], name, { type });
}

export class DraftManager {
  constructor(walletAddress) {
    this.walletAddress = walletAddress?.toLowerCase();
  }

  /**
   * Check if a draft exists for this wallet
   * @returns {Promise<boolean>}
   */
  async hasDraft() {
    if (!supabase || !this.walletAddress) return false;
    
    const { data, error } = await supabase
      .from('launch_drafts')
      .select('id')
      .eq('wallet_address', this.walletAddress)
      .single();
    
    return !error && !!data;
  }

  /**
   * Load draft for this wallet
   * @returns {Promise<Object|null>}
   */
  async loadDraft() {
    if (!supabase || !this.walletAddress) return null;
    
    const { data: draft, error } = await supabase
      .from('launch_drafts')
      .select('*')
      .eq('wallet_address', this.walletAddress)
      .single();
    
    if (error || !draft) return null;
    
    // Load file chunks if any
    const { data: chunks } = await supabase
      .from('draft_file_chunks')
      .select('*')
      .eq('draft_id', draft.id)
      .order('file_name')
      .order('chunk_index');
    
    // Group chunks by file
    const fileChunks = {};
    for (const chunk of (chunks || [])) {
      if (!fileChunks[chunk.file_name]) {
        fileChunks[chunk.file_name] = [];
      }
      fileChunks[chunk.file_name][chunk.chunk_index] = chunk.chunk_data;
    }
    
    return {
      ...draft,
      fileChunks,
    };
  }

  /**
   * Save draft (upsert)
   * @param {Object} draftData - Draft data to save
   * @param {File[]} files - Files to stage (optional, for large file staging)
   * @returns {Promise<Object>}
   */
  async saveDraft(draftData, files = []) {
    if (!supabase || !this.walletAddress) {
      throw new Error('Supabase not configured or wallet not connected');
    }
    
    // Prepare staged file metadata (without actual data for small files)
    const stagedFiles = files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      needsChunking: f.size > CHUNK_SIZE,
    }));
    
    // Upsert draft
    const { data: draft, error } = await supabase
      .from('launch_drafts')
      .upsert({
        wallet_address: this.walletAddress,
        collection_name: draftData.collectionName || null,
        description: draftData.description || null,
        upload_mode: draftData.uploadMode || 'images',
        staged_files: stagedFiles,
        launch_config: draftData.config || {},
        current_step: draftData.step || 1,
        status: 'draft',
      }, {
        onConflict: 'wallet_address',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // For files that need chunking, store chunks
    if (files.length > 0) {
      // Delete old chunks
      await supabase
        .from('draft_file_chunks')
        .delete()
        .eq('draft_id', draft.id);
      
      // Upload new chunks for large files
      for (const file of files.filter(f => f.size > CHUNK_SIZE)) {
        const chunks = await fileToChunks(file);
        
        for (let i = 0; i < chunks.length; i++) {
          await supabase
            .from('draft_file_chunks')
            .insert({
              draft_id: draft.id,
              file_name: file.name,
              chunk_index: i,
              chunk_data: chunks[i],
            });
        }
      }
    }
    
    return draft;
  }

  /**
   * Update draft step/config without re-uploading files
   * @param {Object} updates - Partial updates
   * @returns {Promise<Object>}
   */
  async updateDraft(updates) {
    if (!supabase || !this.walletAddress) {
      throw new Error('Supabase not configured or wallet not connected');
    }
    
    const { data, error } = await supabase
      .from('launch_drafts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', this.walletAddress)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Delete draft and all associated chunks
   * @returns {Promise<boolean>}
   */
  async deleteDraft() {
    if (!supabase || !this.walletAddress) return false;
    
    // Chunks are deleted via CASCADE
    const { error } = await supabase
      .from('launch_drafts')
      .delete()
      .eq('wallet_address', this.walletAddress);
    
    return !error;
  }

  /**
   * Record IPFS pin for this user
   * @param {Object} pinData - Pin information
   * @returns {Promise<Object>}
   */
  async recordPin(pinData) {
    if (!supabase || !this.walletAddress) return null;
    
    const { data, error } = await supabase
      .from('user_ipfs_pins')
      .upsert({
        wallet_address: this.walletAddress,
        ipfs_cid: pinData.cid,
        pin_type: pinData.type || 'collection',
        collection_name: pinData.name,
        file_count: pinData.fileCount,
        pin_size_bytes: pinData.sizeBytes,
      }, {
        onConflict: 'wallet_address,ipfs_cid',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Get all pins for this user
   * @returns {Promise<Array>}
   */
  async getUserPins() {
    if (!supabase || !this.walletAddress) return [];
    
    const { data, error } = await supabase
      .from('user_ipfs_pins')
      .select('*')
      .eq('wallet_address', this.walletAddress)
      .order('created_at', { ascending: false });
    
    return error ? [] : data;
  }

  /**
   * Remove pin record (after unpinning from IPFS)
   * @param {string} cid - The IPFS CID
   * @returns {Promise<boolean>}
   */
  async removePinRecord(cid) {
    if (!supabase || !this.walletAddress) return false;
    
    const { error } = await supabase
      .from('user_ipfs_pins')
      .delete()
      .eq('wallet_address', this.walletAddress)
      .eq('ipfs_cid', cid);
    
    return !error;
  }
}

export default DraftManager;

/**
 * Convenience facade for static-style calls
 * Usage: import { draftManager } from '@/lib/draft-manager'
 *        await draftManager.hasDraft(walletAddress)
 */
export const draftManager = {
  async hasDraft(walletAddress) {
    const manager = new DraftManager(walletAddress);
    return manager.hasDraft();
  },
  
  async loadDraft(walletAddress) {
    const manager = new DraftManager(walletAddress);
    const result = await manager.loadDraft();
    if (!result) return null;
    
    // Reassemble files from chunks if needed
    const files = [];
    const stagedFiles = result.staged_files || [];
    
    for (const fileMeta of stagedFiles) {
      if (fileMeta.needsChunking && result.fileChunks?.[fileMeta.name]) {
        const file = reassembleFilesFromChunks(
          result.fileChunks[fileMeta.name],
          fileMeta.name,
          fileMeta.type
        );
        files.push(file);
      }
    }
    
    return {
      files,
      draft: {
        uploadMode: result.upload_mode,
        metadataFiles: result.launch_config?.metadataFiles || [],
        collectionName: result.collection_name,
        description: result.description,
      },
      updatedAt: result.updated_at,
    };
  },
  
  async saveDraft(walletAddress, draftData, files) {
    const manager = new DraftManager(walletAddress);
    return manager.saveDraft(draftData, files);
  },
  
  async deleteDraft(walletAddress) {
    const manager = new DraftManager(walletAddress);
    return manager.deleteDraft();
  },
  
  async updateDraft(walletAddress, updates) {
    const manager = new DraftManager(walletAddress);
    return manager.updateDraft(updates);
  },
  
  async recordPin(walletAddress, pinData) {
    const manager = new DraftManager(walletAddress);
    return manager.recordPin(pinData);
  },
  
  async getUserPins(walletAddress) {
    const manager = new DraftManager(walletAddress);
    return manager.getUserPins();
  },
  
  async removePinRecord(walletAddress, cid) {
    const manager = new DraftManager(walletAddress);
    return manager.removePinRecord(cid);
  },
};

// Helper to reassemble a single file from chunks
function reassembleFilesFromChunks(chunks, name, type) {
  return chunksToFile(chunks, name, type);
}

// Helper to reassemble files from loaded draft
export function reassembleFiles(fileChunks, stagedFiles) {
  const files = [];
  
  for (const fileMeta of stagedFiles) {
    if (fileMeta.needsChunking && fileChunks[fileMeta.name]) {
      const file = chunksToFile(
        fileChunks[fileMeta.name],
        fileMeta.name,
        fileMeta.type
      );
      files.push(file);
    }
  }
  
  return files;
}
