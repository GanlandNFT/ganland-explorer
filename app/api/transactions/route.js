import { NextResponse } from 'next/server';

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'ThO48tmVpneJP9OB8I4-3ucrNYBrZ2tU';

const GANLAND_WALLETS = [
  '0xc4EF7d096541338FBE007E146De4a7Cd99cb9e40', // GAN Service
  '0xDd32A567bc09384057A1F260086618D88b28E64F', // Ganland.eth
];

const CHAIN_CONFIG = {
  base: {
    url: `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    explorer: 'https://basescan.org',
  },
  optimism: {
    url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    explorer: 'https://optimistic.etherscan.io',
  },
};

// Known wallet-to-handle mappings
const WALLET_HANDLES = {
  '0x4707e990b7dd50288e1b21de1acd53ee2d10f3fb': 'fractalvisions',
  '0x564d0e8f143e3943bf75fae392b71a7048b2727f': 'artfractalicia',
  '0xfb2118b96d50e80ac7ea48001f0d6813f63f5433': '333nft',
  '0xc4ef7d096541338fbe007e146de4a7cd99cb9e40': 'GanlandNFT',
  '0xdd32a567bc09384057a1f260086618d88b28e64f': 'GanlandNFT',
  '0xa702ed4e6a82c8148cc6b1dc7e22f19e4339fc68': 'BeforeDay1',
};

async function fetchTransactions(chain, wallet) {
  const config = CHAIN_CONFIG[chain];
  if (!config) return [];

  try {
    // Fetch asset transfers (includes ERC20, ERC721, etc.)
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: wallet,
          category: ['external', 'erc20', 'erc721', 'erc1155'],
          maxCount: '0x5', // Last 5 transactions
          order: 'desc',
          withMetadata: true,
        }],
      }),
    });

    const data = await response.json();
    const transfers = data.result?.transfers || [];

    // Also fetch incoming transfers
    const inResponse = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'alchemy_getAssetTransfers',
        params: [{
          toAddress: wallet,
          category: ['external', 'erc20', 'erc721', 'erc1155'],
          maxCount: '0x5',
          order: 'desc',
          withMetadata: true,
        }],
      }),
    });

    const inData = await inResponse.json();
    const inTransfers = inData.result?.transfers || [];

    return [...transfers, ...inTransfers].map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value ? parseFloat(tx.value).toFixed(2) : null,
      asset: tx.asset || 'ETH',
      category: tx.category,
      tokenId: tx.erc721TokenId || tx.erc1155Metadata?.[0]?.tokenId,
      chain,
      timestamp: tx.metadata?.blockTimestamp,
      fromHandle: WALLET_HANDLES[tx.from?.toLowerCase()],
      toHandle: WALLET_HANDLES[tx.to?.toLowerCase()],
    }));
  } catch (error) {
    console.error(`Error fetching ${chain} transactions:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const allTransactions = [];

    // Fetch from all chains and wallets
    for (const wallet of GANLAND_WALLETS) {
      for (const chain of Object.keys(CHAIN_CONFIG)) {
        const txs = await fetchTransactions(chain, wallet);
        allTransactions.push(...txs);
      }
    }

    // Sort by timestamp (newest first) and dedupe by hash
    const seen = new Set();
    const sorted = allTransactions
      .filter(tx => {
        if (seen.has(tx.hash)) return false;
        seen.add(tx.hash);
        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10); // Return top 10

    return NextResponse.json({
      success: true,
      transactions: sorted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      transactions: [],
    }, { status: 500 });
  }
}
