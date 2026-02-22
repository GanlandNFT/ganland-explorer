-- Ganland Subscriptions Schema
-- Run this in Supabase SQL Editor

-- Users table (extends Privy data)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_handle TEXT UNIQUE NOT NULL,
  x_id TEXT,
  wallet_address TEXT,
  privy_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_users_x_handle ON users(x_handle);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  x_handle TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  tx_hash TEXT NOT NULL,
  amount_eth NUMERIC NOT NULL,
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for checking active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_handle ON subscriptions(x_handle);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON subscriptions(expires_at);

-- Terminal access logs
CREATE TABLE IF NOT EXISTS terminal_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_handle TEXT NOT NULL,
  wallet_address TEXT,
  access_type TEXT NOT NULL, -- free_list, token_gate, subscription
  gan_balance NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_terminal_logs_handle ON terminal_access_logs(x_handle);
CREATE INDEX IF NOT EXISTS idx_terminal_logs_created ON terminal_access_logs(created_at);

-- Function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription(handle TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE x_handle = handle 
    AND status = 'active' 
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user access info
CREATE OR REPLACE FUNCTION get_user_access(handle TEXT)
RETURNS TABLE (
  has_subscription BOOLEAN,
  subscription_expires TIMESTAMPTZ,
  is_free_list BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    check_subscription(handle),
    (SELECT expires_at FROM subscriptions WHERE x_handle = handle AND status = 'active' ORDER BY expires_at DESC LIMIT 1),
    handle = ANY(ARRAY['iglivision', 'artfractalicia']);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_access_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on logs" ON terminal_access_logs
  FOR ALL USING (auth.role() = 'service_role');
