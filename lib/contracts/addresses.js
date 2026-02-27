// Ganland Launchpad Contract Addresses
// Network: Optimism (Chain ID: 10)
// Deployed: 2026-02-27

export const GANLAND_CONTRACTS = {
  // ===== GANLAND-OWNED CONTRACTS (NEW) =====
  launchpad: '0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed',
  factory: '0xEcD328851AB4936d41a99421f1E06B7157a131E8',
  erc721Implementation: '0xD02AFe771BBbee13F1F28AD4803b19Bc3e665B63',
  erc1155Implementation: '0x1400436e57CCd224369B47B9033E3181847bb293',
  
  // Fee settings
  feeRecipient: '0xDd32A567bc09384057A1F260086618D88b28E64F', // ganland.eth
  platformFee: '10000000000000000', // 0.01 ETH in wei
  
  // ===== DEPRECATED: FRACTAL VISIONS CONTRACTS =====
  // These were the old contracts - fees went to impactoverprofit.eth
  // Keeping for reference only - DO NOT USE
  _deprecated: {
    launchpad: '0xC59eabEbb4F0e808F98a66784A971A167672e882',
    factory: '0xd8bde42DA41E8862C2e3473e8FF8D83675151b76',
    erc721Implementation: '0xc1A789E56Ec736F4E252e7Ec6195d816d2ca86b8',
    erc1155Implementation: '0x5d83b01491f73eDA1Af9b26E07507f9a38F1639B',
    feeRecipient: '0xC4FC57Dedd2463314A3fD2DBadB86B4404C257e5', // impactoverprofit.eth
  }
};

// For wagmi/viem
export const OPTIMISM_CHAIN_ID = 10;

// Quick access aliases
export const LAUNCHPAD_ADDRESS = GANLAND_CONTRACTS.launchpad;
export const FACTORY_ADDRESS = GANLAND_CONTRACTS.factory;
export const CONTRACTS = GANLAND_CONTRACTS;
export const PLATFORM_FEE = GANLAND_CONTRACTS.platformFee;

// Token types for ERC721 vs ERC1155
export const TOKEN_TYPES = {
  ERC721: 0,
  ERC1155: 1,
};

// a16z Can't Be Evil License versions
// https://a16zcrypto.com/introducing-nft-licenses/
export const LICENSE_VERSIONS = {
  CBE_CC0: 0,      // CC0 - Public domain
  CBE_ECR: 1,      // Exclusive Commercial Rights
  CBE_NECR: 2,     // Non-Exclusive Commercial Rights  
  CBE_NECR_HS: 3,  // NECR + No Hate Speech
  CBE_PR: 4,       // Personal Rights only
  CBE_PR_HS: 5,    // Personal Rights + No Hate Speech
};

export const LICENSE_DESCRIPTIONS = {
  [LICENSE_VERSIONS.CBE_CC0]: {
    name: 'CC0 (Public Domain)',
    short: 'CC0',
    description: 'No rights reserved. Anyone can use for any purpose.',
  },
  [LICENSE_VERSIONS.CBE_ECR]: {
    name: 'Exclusive Commercial Rights',
    short: 'ECR',
    description: 'Owner has exclusive commercial rights to the art.',
  },
  [LICENSE_VERSIONS.CBE_NECR]: {
    name: 'Non-Exclusive Commercial Rights',
    short: 'NECR',
    description: 'Owner can commercialize, but creator retains rights too.',
  },
  [LICENSE_VERSIONS.CBE_NECR_HS]: {
    name: 'NECR + No Hate Speech',
    short: 'NECR-HS',
    description: 'Non-exclusive commercial rights with hate speech restriction.',
  },
  [LICENSE_VERSIONS.CBE_PR]: {
    name: 'Personal Rights Only',
    short: 'PR',
    description: 'Personal use only, no commercial rights.',
  },
  [LICENSE_VERSIONS.CBE_PR_HS]: {
    name: 'Personal + No Hate Speech',
    short: 'PR-HS',
    description: 'Personal use only with hate speech restriction.',
  },
};

export default GANLAND_CONTRACTS;
