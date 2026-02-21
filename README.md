# Ganland Explorer

<img width="100" alt="GAN Logo" src="https://raw.githubusercontent.com/GanlandNFT/ganland-brand-kit/main/logos/gan-logo-primary.jpg" align="right">

AI-powered NFT ecosystem explorer for **Fractal Visions** — featuring multi-chain wallet integration via Privy.

**Live:** [ganland.ai](https://ganland.ai)

---

## 🌟 Features

- **Multi-Chain Portfolio** — View NFTs & tokens across 7 chains
- **Privy Wallet Integration** — Login with X, email, or existing wallet
- **Collection Browser** — Explore Fractal Visions collections
- **Zapper API** — Real-time portfolio data across 50+ chains
- **AI Art Generation** — Generate art with $GAN tokens

---

## 🔗 Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Ethereum | 1 | ✅ |
| Optimism | 10 | ✅ |
| Base | 8453 | ✅ |
| Shape | 360 | ✅ |
| Soneium | 1868 | ✅ |
| Unichain | 130 | ✅ |
| Superseed | 5330 | ✅ |

---

## 📦 Collections

### Base (Chain ID: 8453)
| Collection | Contract | Supply |
|------------|----------|--------|
| Gan Frens | `0xdee94416167780b47127624bab7730a43187630d` | 100 |
| Babybirds | `0x...` | 100 |

### Optimism (Chain ID: 10)
| Collection | Contract | Supply |
|------------|----------|--------|
| Micro Cosms | `0x56f3e100a11fe5f01d7681eb887bcfb220f82118` | 5 |
| Elements of Ganland | `0x...` | 5 |
| Trashgans | `0x...` | 5 |
| Global Gans | `0x...` | 5 |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Wallet:** Privy
- **Data:** Zapper API, Alchemy
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Privy App ID (from [privy.io](https://privy.io))
- Zapper API Key (from [build.zapper.xyz](https://build.zapper.xyz))

### Environment Variables
```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
ZAPPER_API_KEY=your-zapper-api-key
ALCHEMY_API_KEY=your-alchemy-key
```

### Installation
```bash
git clone https://github.com/GanlandNFT/ganland-explorer.git
cd ganland-explorer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
ganland-explorer/
├── app/
│   ├── page.tsx           # Home / Portfolio view
│   ├── collections/       # Collection browser
│   └── layout.tsx         # Root layout with Privy
├── components/
│   ├── WalletModule.tsx   # Portfolio display
│   ├── CollectionCard.tsx # NFT collection cards
│   └── ChainSelector.tsx  # Multi-chain switcher
├── lib/
│   ├── zapper.ts          # Zapper API client
│   ├── alchemy.ts         # Alchemy NFT queries
│   └── chains.ts          # Chain configurations
├── data/
│   └── collections.json   # Collection metadata
└── public/
    └── chain-icons/       # Chain logos
```

---

## 🔌 API Integration

### Zapper (Portfolio Data)
```typescript
// lib/zapper.ts
const response = await fetch('https://public.zapper.xyz/graphql', {
  headers: { 'x-zapper-api-key': process.env.ZAPPER_API_KEY },
  body: JSON.stringify({
    query: portfolioQuery,
    variables: { addresses: [walletAddress] }
  })
});
```

### Alchemy (NFT Data)
```typescript
// lib/alchemy.ts
const nfts = await alchemy.nft.getNftsForOwner(address);
```

---

## 🎨 Related Repositories

- **[ganland-wallet](https://github.com/GanlandNFT/ganland-wallet)** — HD wallet system
- **[gan-art-service](https://github.com/GanlandNFT/gan-art-service)** — AI art generation
- **[fractal-nft-infra](https://github.com/GanlandNFT/fractal-nft-infra)** — Smart contracts
- **[ganland-brand-kit](https://github.com/GanlandNFT/ganland-brand-kit)** — Brand assets

---

## 📄 License

MIT

---

*Part of the [Fractal Visions](https://fractalvisions.io) ecosystem*
