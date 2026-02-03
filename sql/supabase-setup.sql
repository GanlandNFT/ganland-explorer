-- GAN Payment Service + Ganland Explorer - Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- Project: qeubpfvvmfgdvjxlvmwh

-- ============================================
-- PAYMENT SERVICE TABLES
-- ============================================

-- Users table (X handle to wallet mapping)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_handle TEXT UNIQUE NOT NULL,
  x_id TEXT,
  wallet_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table (art generation orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  requester_handle TEXT NOT NULL,
  requester_wallet TEXT,
  prompt TEXT NOT NULL,
  amount NUMERIC DEFAULT 500000000000000000000000, -- 500k $GAN (18 decimals)
  status TEXT DEFAULT 'pending_payment',
  tweet_id TEXT,
  reply_tweet_id TEXT,
  tx_hash TEXT,
  image_url TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Transfers table (incoming $GAN payments)
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT UNIQUE NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  block_number BIGINT,
  matched_order_id UUID REFERENCES orders(id),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GANLAND EXPLORER TABLES
-- ============================================

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_supply INTEGER,
  ipfs_cid TEXT,
  image_format TEXT,
  preview_url TEXT,
  marketplace_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_address, chain)
);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  image_url TEXT,
  ipfs_url TEXT,
  metadata_url TEXT,
  attributes JSONB,
  owner_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, token_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Payment Service indexes
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(x_handle);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_requester ON orders(requester_handle);
CREATE INDEX IF NOT EXISTS idx_orders_wallet ON orders(requester_wallet);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_transfers_processed ON transfers(processed);
CREATE INDEX IF NOT EXISTS idx_transfers_matched ON transfers(matched_order_id);

-- Explorer indexes
CREATE INDEX IF NOT EXISTS idx_collections_chain ON collections(chain);
CREATE INDEX IF NOT EXISTS idx_collections_contract ON collections(contract_address);
CREATE INDEX IF NOT EXISTS idx_nfts_collection ON nfts(collection_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_address);

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================

-- Uncomment to enable RLS
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INITIAL DATA - Ganland Collections
-- ============================================

INSERT INTO collections (contract_address, chain, chain_id, name, total_supply, ipfs_cid, image_format, preview_url, marketplace_url)
VALUES 
  ('0xdee94416167780b47127624bab7730a43187630d', 'base', 8453, 'Gan Frens', 100, 'QmPz5qbUeNCY72TYZ3UGAewgmPNCBnPi7T4qWqXxuh6WCp', 'jpeg', 'https://ipfs.io/ipfs/QmPz5qbUeNCY72TYZ3UGAewgmPNCBnPi7T4qWqXxuh6WCp/0.jpeg', 'https://www.fractalvisions.io/collections/0xdee94416167780b47127624bab7730a43187630d/collection?chain=base'),
  ('0xef38e760918a40b13019db894e898428ffdb3aaf', 'base', 8453, 'Babybirds', 100, 'QmagDYqSxq7EHiKZmFU8vkHkFszRSsJ21otLvtpp49Hf2M', 'jpg', 'https://ipfs.io/ipfs/QmagDYqSxq7EHiKZmFU8vkHkFszRSsJ21otLvtpp49Hf2M/0.jpg', 'https://www.fractalvisions.io/collections/0xef38e760918a40b13019db894e898428ffdb3aaf/collection?chain=base'),
  ('0x70706edeea0bb9fb8a9214764066b79441528704', 'optimism', 10, 'Elements of Ganland', 5, 'QmNTAGpipz7TRNsPaid1vSrUpW6gfRHYYxZiQ8Fja1kNg9', 'png', 'https://ipfs.io/ipfs/QmNTAGpipz7TRNsPaid1vSrUpW6gfRHYYxZiQ8Fja1kNg9/0.png', 'https://www.fractalvisions.io/collections/0x70706edeea0bb9fb8a9214764066b79441528704/collection?chain=optimism'),
  ('0x56f3e100a11fe5f01d7681eb887bcfb220f82118', 'optimism', 10, 'Micro Cosms', 5, 'QmXC9WpyTD5UeXHcyZNGzdmA79kiR4J1rxhSKayNCd14Kr', 'jpeg', 'https://ipfs.io/ipfs/QmXC9WpyTD5UeXHcyZNGzdmA79kiR4J1rxhSKayNCd14Kr/0.jpeg', 'https://www.fractalvisions.io/collections/0x56f3e100a11fe5f01d7681eb887bcfb220f82118/collection?chain=optimism'),
  ('0xb1eddb902ef733baf8e324e955ee6d46cce34708', 'optimism', 10, 'Trashgans', 5, 'QmTNSJiNghkVG73QBteomMEdJnRHPmGTJMNiSHLbbLeuN3', 'png', 'https://ipfs.io/ipfs/QmTNSJiNghkVG73QBteomMEdJnRHPmGTJMNiSHLbbLeuN3/0.png', 'https://www.fractalvisions.io/collections/0xb1eddb902ef733baf8e324e955ee6d46cce34708/collection?chain=optimism'),
  ('0xbb1b0da320ccc7a677a2fe00871f422e2e505fb1', 'optimism', 10, 'Global Gans', 5, 'QmVBm8BwPdNTfPAhqjGhAU8ESKZ9VFNvw5n6TYbYK7tJZm', 'png', 'https://ipfs.io/ipfs/QmVBm8BwPdNTfPAhqjGhAU8ESKZ9VFNvw5n6TYbYK7tJZm/0.png', 'https://www.fractalvisions.io/collections/0xbb1b0da320ccc7a677a2fe00871f422e2e505fb1/collection?chain=optimism')
ON CONFLICT (contract_address, chain) DO NOTHING;
