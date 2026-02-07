'use client';

import './globals.css';
import { PrivyProvider } from '@privy-io/react-auth';
import ActivityBar from '../components/ActivityBar';
import Header from '../components/Header';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Ganland Explorer - NFT Collections & Wallet</title>
        <meta name="description" content="AI-powered NFT ecosystem explorer for Fractal Visions" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-gan-black">
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'placeholder'}
          config={{
            loginMethods: ['twitter', 'email', 'wallet'],
            appearance: {
              theme: 'dark',
              accentColor: '#ffcc00',
              logo: 'https://raw.githubusercontent.com/GanlandNFT/ganland-brand-kit/main/logos/gan-logo-primary.jpg',
            },
            embeddedWallets: {
              createOnLogin: 'users-without-wallets',
            },
          }}
        >
          <ActivityBar />
          <Header />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-gray-800 py-6 mt-12">
            <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
              <p>© 2026 GANLAND. Part of the <a href="https://fractalvisions.io" className="text-gan-yellow hover:underline">Fractal Visions</a> ecosystem.</p>
              <div className="mt-2 space-x-4">
                <a href="/terms" className="hover:text-gan-yellow">Terms</a>
                <a href="/privacy" className="hover:text-gan-yellow">Privacy</a>
                <a href="https://x.com/GanlandNFT" className="hover:text-gan-yellow">@GanlandNFT</a>
              </div>
            </div>
          </footer>
        </PrivyProvider>
      </body>
    </html>
  );
}
