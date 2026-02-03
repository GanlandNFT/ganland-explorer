# Ganland Explorer

NFT collection explorer and wallet dashboard for the Ganland ecosystem.

## Features

- 🖼️ Browse Ganland NFT collections
- 💰 View wallet balances ($GAN, $VISION, $OP)
- 🔗 Multi-chain support (Base, Optimism, Shape, Soneium, Unichain, Superseed)
- 🔐 Privy wallet integration
- 📊 Activity tracking

## Collections

| Collection | Chain | Contract |
|------------|-------|----------|
| GAN Frens | Base | `0xdee94416167780b47127624bab7730a43187630d` |
| Micro Cosms | Optimism | `0x56f3e100a11fe5f01d7681eb887bcfb220f82118` |
| Babybirds | Base | `0xef38e760918a40b13019db894e898428ffdb3aaf` |
| Elements of Ganland | Optimism | `0x70706edeea0bb9fb8a9214764066b79441528704` |
| Trashgans | Optimism | `0xb1eddb902ef733baf8e324e955ee6d46cce34708` |
| Global Gans | Optimism | `0x3ada4b50d39c12fac10e84e8f7f46e08b8e58e16` |

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Auth:** Privy (embedded wallets)
- **Database:** Supabase
- **Blockchain:** viem + Alchemy RPC
- **IPFS:** Pinata gateway

## Setup

```bash
npm install
cp .env.example .env
# Add your Privy App ID and Supabase credentials
npm run dev
```

## Environment Variables

```
VITE_PRIVY_APP_ID=cmi4n75fu01fhl20dy2gwwr1g
VITE_SUPABASE_URL=https://qeubpfvvmfgdvjxlvmwh.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ALCHEMY_API_KEY=your-alchemy-key
```

## Database

See `sql/supabase-setup.sql` for the complete database schema.

## Related Repos

- [ganland-wallet](https://github.com/GanlandNFT/ganland-wallet) - HD wallet system
- [gan-art-service](https://github.com/GanlandNFT/gan-art-service) - AI art generation
- [gan-payment-service](https://github.com/GanlandNFT/gan-payment-service) - Payment processing

## License

MIT
