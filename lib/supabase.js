import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qeubpfvvmfgdvjxlvmwh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Wallet to X handle mappings (loaded from Supabase or fallback)
export const knownWallets = {
  '0x4707E990b7dd50288e1B21De1ACD53EE2D10f3FB': { handle: 'fractalvisions', type: 'founder' },
  '0x564D0e8F143e3943BF75FaE392b71a7048b2727f': { handle: 'artfractalicia', type: 'founder' },
  '0xFB2118b96D50E80aC7EA48001f0d6813F63F5433': { handle: '333nft', type: 'tester' },
  '0xc4EF7d096541338FBE007E146De4a7Cd99cb9e40': { handle: 'GanlandNFT', type: 'service' },
  '0xDd32A567bc09384057A1F260086618D88b28E64F': { handle: 'GanlandNFT', type: 'treasury' },
  '0xa702eD4E6a82c8148Cc6B1DC7E22f19E4339fC68': { handle: 'BeforeDay1', type: 'user' },
};

export function getHandleForWallet(address) {
  const normalized = address?.toLowerCase();
  for (const [wallet, info] of Object.entries(knownWallets)) {
    if (wallet.toLowerCase() === normalized) {
      return info;
    }
  }
  return null;
}

export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
