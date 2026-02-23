-- Ganland Mint Orders Schema
-- Order book for NFT minting jobs (similar to mention jobs)

-- Mint orders table
CREATE TABLE IF NOT EXISTS mint_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order info
  order_number SERIAL,
  status TEXT DEFAULT 'pending', -- pending, generating, uploading, minting, completed, failed
  
  -- Source (how the mint was initiated)
  source TEXT NOT NULL, -- 'website', 'x_mention', 'direct_transfer'
  source_id TEXT, -- tweet_id for X mentions, tx_hash for direct transfers
  
  -- Buyer info
  buyer_address TEXT NOT NULL,
  buyer_x_handle TEXT,
  
  -- Payment info
  payment_tx_hash TEXT,
  payment_amount_eth NUMERIC,
  payment_confirmed_at TIMESTAMPTZ,
  
  -- Collection info
  collection_address TEXT NOT NULL,
  collection_name TEXT,
  
  -- Artwork generation
  generation_prompt TEXT,
  generation_style TEXT, -- 'fractal', 'geometric', 'particle', 'random'
  generation_id TEXT, -- Leonardo job ID
  image_url TEXT, -- Generated image URL
  
  -- IPFS upload
  ipfs_image_cid TEXT,
  ipfs_metadata_cid TEXT,
  
  -- Minting
  token_id INTEGER,
  mint_tx_hash TEXT,
  minted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_mint_orders_status ON mint_orders(status);
CREATE INDEX IF NOT EXISTS idx_mint_orders_buyer ON mint_orders(buyer_address);
CREATE INDEX IF NOT EXISTS idx_mint_orders_collection ON mint_orders(collection_address);
CREATE INDEX IF NOT EXISTS idx_mint_orders_created ON mint_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_mint_orders_payment_tx ON mint_orders(payment_tx_hash);

-- Function to get next pending order
CREATE OR REPLACE FUNCTION get_next_pending_order()
RETURNS mint_orders AS $$
DECLARE
  next_order mint_orders;
BEGIN
  SELECT * INTO next_order
  FROM mint_orders
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  RETURN next_order;
END;
$$ LANGUAGE plpgsql;

-- Function to update order status
CREATE OR REPLACE FUNCTION update_order_status(
  order_id UUID,
  new_status TEXT,
  error_msg TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE mint_orders
  SET 
    status = new_status,
    updated_at = NOW(),
    error_message = COALESCE(error_msg, error_message),
    completed_at = CASE WHEN new_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END
  WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- View for active queue
CREATE OR REPLACE VIEW mint_queue AS
SELECT 
  order_number,
  status,
  source,
  buyer_address,
  buyer_x_handle,
  collection_name,
  generation_style,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 AS minutes_waiting
FROM mint_orders
WHERE status NOT IN ('completed', 'failed')
ORDER BY created_at ASC;

-- RLS Policies
ALTER TABLE mint_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on mint_orders" ON mint_orders
  FOR ALL USING (auth.role() = 'service_role');
