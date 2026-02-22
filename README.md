# Ganland Explorer

<img width="100" alt="GAN Logo" src="https://raw.githubusercontent.com/GanlandNFT/ganland-brand-kit/main/logos/gan-logo-primary.jpg" align="right">

AI-powered NFT ecosystem explorer for **Fractal Visions** — featuring multi-chain wallet integration via Privy.

**Live:** [ganland.ai](https://ganland.ai)

---

## 🌟 Features

- **Multi-Chain Portfolio** — View NFTs & tokens across 7 chains
- **Privy Wallet Integration** — Login with X, email, or existing wallet
- **Collection Browser** — Explore Fractal Visions collections
- **AI Art Generation** — Generate art with $GAN tokens
- **GAN Terminal** — Token-gated command interface
- **Neural Networkers Mint** — Mint generative mandalas

---

## 📁 Project Structure

```
ganland-ai/
├── app/
│   ├── page.jsx              # Home / Portfolio view
│   ├── layout.jsx            # Root layout with Privy
│   ├── docs/                 # Documentation (tabbed)
│   │   ├── page.jsx          # Overview
│   │   ├── wallet/           # Wallet commands
│   │   ├── transfers/        # Token transfers
│   │   ├── nfts/             # NFT operations
│   │   ├── art/              # Art generation
│   │   └── agents/           # Agent integration
│   ├── terminal/             # Token-gated terminal
│   │   └── page.jsx
│   ├── mint/
│   │   └── neural/           # Neural Networkers mint
│   └── api/
│       └── terminal/         # Terminal access APIs
├── components/
│   ├── DocsLayout.jsx        # Docs navigation
│   ├── Header.jsx            # Site header
│   └── ...
├── lib/
│   ├── supabase.js           # Supabase client
│   └── terminal-access.js    # Access control
└── sql/
    └── subscriptions.sql     # Database schema
```

---

## 🔐 Terminal Access

The GAN Terminal requires one of:

| Method | Requirement |
|--------|-------------|
| **Free List** | @iglivision, @artfractalicia |
| **Token Gate** | Hold 6,900,000 $GAN |
| **Subscription** | $30/month in ETH to ganland.eth |

---

## 🔗 Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Ethereum | 1 | ✅ |
| Optimism | 10 | ✅ |
| Base | 8453 | ✅ Primary |
| Shape | 360 | ✅ |
| Soneium | 1868 | ✅ |
| Unichain | 130 | ✅ |
| Superseed | 5330 | ✅ |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Wallet:** Privy
- **Data:** Supabase, Alchemy, Zapper API
- **Blockchain:** viem
- **Deployment:** Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Privy App ID (from [privy.io](https://privy.io))
- Supabase project (from [supabase.com](https://supabase.com))

### Environment Variables
```bash
cp .env.example .env.local
# Fill in your credentials
```

### Installation
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database Setup
Run `sql/subscriptions.sql` in Supabase SQL Editor to create tables.

---

## 📖 Documentation

See `/docs` for full command reference:

- **Wallet** — Create wallet, check balance
- **Transfers** — Send $GAN, ETH to users
- **NFTs** — Buy, sell, mint, transfer across 7 chains
- **Art** — Generate AI art with $GAN
- **Agents** — Integration guide for AI agents

---

## 🎨 Related Repositories

| Repo | Description |
|------|-------------|
| [ganland-wallet](https://github.com/GanlandNFT/ganland-wallet) | HD wallet system |
| [gan-art-service](https://github.com/GanlandNFT/gan-art-service) | AI art generation |
| [gan-payment-service](https://github.com/GanlandNFT/gan-payment-service) | Payment processing |
| [ganland-skills](https://github.com/GanlandNFT/ganland-skills) | Agent skills |
| [ganland-docs](https://github.com/GanlandNFT/ganland-docs) | Command reference |
| [ganland-brand-kit](https://github.com/GanlandNFT/ganland-brand-kit) | Brand assets |

---

## 📄 License

MIT

---

*Part of the [Fractal Visions](https://fractalvisions.io) ecosystem*
