-- Migration: Create launch_drafts table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS launch_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL UNIQUE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  staged_files JSONB DEFAULT '[]', -- Array of {name, type, size, data_url} or chunk refs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_launch_drafts_wallet ON launch_drafts(user_wallet);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_launch_drafts_updated_at ON launch_drafts;
CREATE TRIGGER update_launch_drafts_updated_at
  BEFORE UPDATE ON launch_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table for large file chunks (for files > 1MB, store in chunks)
CREATE TABLE IF NOT EXISTS draft_file_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id UUID REFERENCES launch_drafts(id) ON DELETE CASCADE,
  file_index INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_data TEXT NOT NULL, -- base64 chunk
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draft_id, file_index, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_draft_chunks_draft ON draft_file_chunks(draft_id);

-- Collection IPFS tracking table
CREATE TABLE IF NOT EXISTS collection_ipfs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_wallet TEXT NOT NULL,
  collection_address TEXT,
  images_cid TEXT,
  metadata_cid TEXT,
  base_uri TEXT,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' -- active, unpinned
);

CREATE INDEX IF NOT EXISTS idx_collection_ipfs_wallet ON collection_ipfs(user_wallet);
CREATE INDEX IF NOT EXISTS idx_collection_ipfs_address ON collection_ipfs(collection_address);

-- Enable RLS
ALTER TABLE launch_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_file_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_ipfs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for service role, restrict for anon)
CREATE POLICY "Service role full access on launch_drafts" ON launch_drafts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on draft_file_chunks" ON draft_file_chunks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on collection_ipfs" ON collection_ipfs
  FOR ALL USING (true) WITH CHECK (true);
