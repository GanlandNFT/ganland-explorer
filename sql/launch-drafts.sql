-- Launch Drafts Table
-- Stores draft collection uploads (one per wallet)
-- Files are staged here before IPFS pinning

CREATE TABLE IF NOT EXISTS launch_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  
  -- Draft metadata
  collection_name TEXT,
  description TEXT,
  upload_mode TEXT DEFAULT 'images', -- 'images' or 'full'
  
  -- Staged file references (stored as base64 chunks or R2 refs)
  staged_files JSONB DEFAULT '[]'::jsonb,
  -- Format: [{ "name": "1.png", "type": "image/png", "size": 12345, "chunks": ["chunk_id_1", "chunk_id_2"] }]
  
  -- Configuration from step 2
  launch_config JSONB DEFAULT '{}'::jsonb,
  
  -- IPFS data (only populated after pinning)
  ipfs_images_cid TEXT,
  ipfs_metadata_cid TEXT,
  ipfs_base_uri TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'draft', -- 'draft', 'staged', 'pinned', 'deployed'
  current_step INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookup
CREATE INDEX IF NOT EXISTS idx_launch_drafts_wallet ON launch_drafts(wallet_address);

-- File chunks table (for large files that exceed Vercel limits)
CREATE TABLE IF NOT EXISTS draft_file_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES launch_drafts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_data TEXT NOT NULL, -- base64 encoded chunk (max 500KB per chunk)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(draft_id, file_name, chunk_index)
);

-- Index for reassembling files
CREATE INDEX IF NOT EXISTS idx_draft_chunks_file ON draft_file_chunks(draft_id, file_name, chunk_index);

-- User IPFS pins tracking (for unpin/delete)
CREATE TABLE IF NOT EXISTS user_ipfs_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  ipfs_cid TEXT NOT NULL,
  pin_type TEXT DEFAULT 'collection', -- 'collection', 'images', 'metadata'
  collection_name TEXT,
  file_count INTEGER,
  pin_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(wallet_address, ipfs_cid)
);

CREATE INDEX IF NOT EXISTS idx_user_pins_wallet ON user_ipfs_pins(wallet_address);

-- Function to update timestamp on draft changes
CREATE OR REPLACE FUNCTION update_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS trigger_draft_updated ON launch_drafts;
CREATE TRIGGER trigger_draft_updated
  BEFORE UPDATE ON launch_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_draft_timestamp();

-- RLS Policies (users can only access their own drafts)
ALTER TABLE launch_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_file_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ipfs_pins ENABLE ROW LEVEL SECURITY;

-- Note: For service role access (API routes), RLS is bypassed
-- For client-side access, add policies based on auth.uid() or wallet verification
