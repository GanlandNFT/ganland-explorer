'use client';

import { http, createConfig } from 'wagmi';
import { optimism, base } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [optimism, base],
  transports: {
    [optimism.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});
