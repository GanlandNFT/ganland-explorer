# Ganland Terminal & Docs Implementation Plan

## Overview

Building three key features for ganland.ai:
1. **`/terminal`** - Token-gated command terminal
2. **`/mint/neural`** - Neural Networkers mint page
3. **`/docs`** - Reorganized, paginated documentation

---

## 1. Terminal (`/terminal`)

### Access Control (Priority Order)
| Check | Condition | Result |
|-------|-----------|--------|
| 1. Login | Privy X auth | Required |
| 2. Free List | X handle in `["iglivision", "artfractalicia"]` | ✅ Grant access |
| 3. Token Gate | Wallet holds ≥ 6,900,000 $GAN | ✅ Grant access |
| 4. Subscription | Active $30 ETH/month to ganland.eth | ✅ Grant access |
| 5. None | No conditions met | Show upgrade options |

### Features
- Real terminal UI (VS Code-style)
- Command input with autocomplete
- Response output area
- History/context
- Balance check on load

### Command Categories

#### Wallet
```
create wallet
my address / show my address
balance / check balance
```

#### Transfers
```
send [amount] $GAN to @user
send [amount] $GAN to 0x...
send [amount] $GAN to @user1 @user2 @user3  (multi-send)
send [amount] ETH to @user
```

#### NFT - Viewing
```
show my NFTs
what NFTs do I own?
my NFTs on base
show the floor price for [collection]
trending NFT collections
top NFTs on base
```

#### NFT - Buying
```
buy this NFT: [fractalvisions.io link]
buy the cheapest [collection]
buy floor [collection]
show me listings for [collection] under [price] ETH
```

#### NFT - Selling
```
list my [collection] #[id] for [price] ETH
sell my NFT for [price] ETH
cancel my NFT listing
remove my [collection] from sale
what offers do I have on my NFTs?
accept the best offer on my [collection]
```

#### NFT - Minting
```
mint from [fractalvisions.io link]
mint this NFT: [link]
what's minting today?
show featured NFT mints
mint neural  (Neural Networkers)
```

#### NFT - Transfers
```
send my [collection] #[id] to 0x...
transfer my NFT to vitalik.eth
send this NFT to @username
```

#### NFT - Search
```
search for [collection]
find NFT collection: [name]
```

#### Art Generation
```
generate [prompt]
generate cyberpunk [prompt]
```

### Supported Chains
- Ethereum
- Optimism
- Base
- Shape
- Soneium
- Unichain
- Superseed

---

## 2. Mint Page (`/mint/neural`)

### Route
- Current: `gan-mandala-mint.vercel.app`
- Target: `ganland.ai/mint/neural`

### Features
- Collection info (price, supply, per-wallet)
- Mint button with Privy wallet
- Agent skill instructions
- Gallery preview

---

## 3. Documentation (`/docs`)

### Structure (Tabbed Navigation)
```
/docs
├── /docs (overview)
├── /docs/wallet
├── /docs/transfers
├── /docs/nfts
├── /docs/art
└── /docs/agents
```

### Pages

#### `/docs` (Overview)
- Quick start
- Links to sections

#### `/docs/wallet`
- Create wallet
- View address
- Check balance

#### `/docs/transfers`
- Send to user
- Send to address
- Multi-send

#### `/docs/nfts`
- Viewing NFTs
- Buying NFTs
- Selling NFTs
- Minting NFTs
- Transferring NFTs
- Searching collections

#### `/docs/art`
- Generate art
- Style presets
- Pricing

#### `/docs/agents`
- Skill file
- Integration guide
- Contract addresses

---

## 4. Storage Architecture

### Data Flow
```
User Action → Privy Metadata (primary)
                    ↓
               Supabase (backup)
                    ↓
               D1/R2 (archive)
```

### Privy Metadata
- X handle
- Wallet address
- Subscription status
- Subscription expiry

### Supabase Tables
- `users` (x_handle, wallet, created_at)
- `subscriptions` (user_id, started_at, expires_at, tx_hash)
- `orders` (art generation tracking)
- `transfers` (payment verification)

### R2 Backup
- Daily snapshots
- Transaction logs

---

## 5. API Routes

### Existing
- `POST /api/collection-image`
- `GET /api/featured-artists`
- `GET /api/transactions`

### New
- `GET /api/terminal/auth` - Check access
- `POST /api/terminal/command` - Execute command
- `GET /api/subscription/check` - Check subscription status
- `POST /api/subscription/verify` - Verify ETH payment

---

## 6. Environment Variables

```env
# Existing
NEXT_PUBLIC_PRIVY_APP_ID=
SUPABASE_URL=
SUPABASE_KEY=

# New
GAN_TOKEN_ADDRESS=0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07
SUBSCRIPTION_WALLET=0xF393AA...57C6  # ganland.eth
SUBSCRIPTION_PRICE_ETH=0.015  # $30 ≈ 0.015 ETH
ALCHEMY_API_KEY=
```

---

## Implementation Order

1. ✅ Clone repo, understand structure
2. 🔄 Create `/mint/neural` route (simpler, validate setup)
3. 🔄 Create `/docs` tabbed structure
4. 🔄 Create `/terminal` with access control
5. 🔄 Add subscription verification
6. 🔄 Add command handlers
7. 🔄 Connect to backend services
8. 🔄 Test and deploy

---

## Contract Addresses

| Contract | Address | Chain |
|----------|---------|-------|
| $GAN Token | `0xc2fa8cfa51B02fDeb84Bb22d3c9519EAEB498b07` | Base |
| Payment Wallet | `0xc4EF7d096541338FBE007E146De4a7Cd99cb9e40` | Base |
| Neural Networkers | `0xd1415559a3eCA34694a38A123a12cC6AC17CaFea` | Base |
| ganland.eth | TBD - need resolver | Multiple |

---

*Created: 2026-02-22*
