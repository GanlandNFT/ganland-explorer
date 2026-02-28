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

// For wagmi/viem - keyed by chain ID
export const CONTRACTS = {
  10: { // Optimism
    LAUNCHPAD: '0x07cB9a4c2Dc5Bb341A6F1A20D7641A70bF91E5Ed',
    FACTORY: '0xEcD328851AB4936d41a99421f1E06B7157a131E8',
    ERC721_IMPL: '0xD02AFe771BBbee13F1F28AD4803b19Bc3e665B63',
    ERC1155_IMPL: '0x1400436e57CCd224369B47B9033E3181847bb293',
  }
};

// Token types for launchpad
export const TOKEN_TYPES = {
  ERC721: 0,
  ERC1155: 1,
};

// License versions - Full list from IP smart contract
export const LICENSE_VERSIONS = {
  CC0: 0,                    // Public domain - no rights reserved
  PERSONAL_USE: 1,           // Personal, non-commercial use only
  COMMERCIAL: 2,             // Commercial use allowed
  COMMERCIAL_NO_HATE: 3,     // Commercial use, no hate speech
  EXCLUSIVE: 4,              // Exclusive rights transfer
  CBE_CC0: 5,                // Can't Be Evil - CC0
  CBE_NECR: 6,               // Can't Be Evil - Non-Exclusive Commercial Rights
  CBE_NECR_HS: 7,            // Can't Be Evil - NECR with Hate Speech clause
  CBE_ECR: 8,                // Can't Be Evil - Exclusive Commercial Rights
  CBE_PR: 9,                 // Can't Be Evil - Personal Rights
  CBE_PR_HS: 10,             // Can't Be Evil - Personal Rights with HS clause
};

// License descriptions (for UI)
export const LICENSE_DESCRIPTIONS = {
  0: 'CC0 - Public Domain (No rights reserved)',
  1: 'Personal Use Only (Non-commercial)',
  2: 'Commercial Use Allowed',
  3: 'Commercial Use (No hate speech)',
  4: 'Exclusive Rights Transfer',
  5: 'CBE-CC0 (Can\'t Be Evil - Public Domain)',
  6: 'CBE-NECR (Non-Exclusive Commercial Rights)',
  7: 'CBE-NECR-HS (NECR + Hate Speech clause)',
  8: 'CBE-ECR (Exclusive Commercial Rights)',
  9: 'CBE-PR (Personal Rights)',
  10: 'CBE-PR-HS (Personal Rights + HS clause)',
};

// Platform fee in wei (0.01 ETH)
export const PLATFORM_FEE = '10000000000000000';

// For wagmi/viem
export const OPTIMISM_CHAIN_ID = 10;

// Quick access
export const LAUNCHPAD_ADDRESS = GANLAND_CONTRACTS.launchpad;
export const FACTORY_ADDRESS = GANLAND_CONTRACTS.factory;

export default GANLAND_CONTRACTS;
