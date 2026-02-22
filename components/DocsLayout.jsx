'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/docs', label: 'Overview', icon: '📋' },
  { href: '/docs/wallet', label: 'Wallet', icon: '💰' },
  { href: '/docs/transfers', label: 'Transfers', icon: '💸' },
  { href: '/docs/nfts', label: 'NFTs', icon: '🖼️' },
  { href: '/docs/art', label: 'Art Generation', icon: '🎨' },
  { href: '/docs/agents', label: 'For Agents', icon: '🤖' },
];

export default function DocsLayout({ children }) {
  const pathname = usePathname();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-gan-yellow">GAN</span> Documentation
        </h1>
        <p className="text-gray-400">
          Complete reference for @GanlandNFT commands on X/Twitter and the terminal
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-800 pb-4">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${isActive 
                  ? 'bg-gan-yellow text-black font-medium' 
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'}
              `}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-gray-500 text-sm">
            Need help? Tweet <a href="https://x.com/GanlandNFT" className="text-gan-yellow hover:underline">@GanlandNFT</a>
          </div>
          <div className="flex gap-4">
            <a href="https://github.com/GanlandNFT/ganland-docs" className="text-gray-500 hover:text-white transition-colors">
              📖 View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable command row component
export function CommandRow({ command, description, example, status, chain }) {
  return (
    <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <code className="text-gan-yellow font-mono text-sm">{command}</code>
          <p className="text-gray-400 text-sm mt-1">{description}</p>
          {example && (
            <p className="text-gray-500 text-xs mt-2 font-mono">
              Example: <span className="text-gray-400">{example}</span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {chain && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full whitespace-nowrap">
              {chain}
            </span>
          )}
          {status === 'coming' && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full whitespace-nowrap">
              Coming Soon
            </span>
          )}
          {status === 'new' && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full whitespace-nowrap">
              New
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Section component
export function DocsSection({ title, icon, description, children }) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xl">{icon}</span>
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-gray-400 text-sm">{description}</p>}
        </div>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </section>
  );
}

// Info box
export function InfoBox({ type = 'info', title, children }) {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    tip: 'bg-green-500/10 border-green-500/30 text-green-400',
    danger: 'bg-red-500/10 border-red-500/30 text-red-400',
  };

  const icons = {
    info: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
    danger: '🚨',
  };

  return (
    <div className={`p-4 border rounded-lg ${styles[type]}`}>
      <div className="flex items-center gap-2 font-bold mb-2">
        <span>{icons[type]}</span>
        <span>{title}</span>
      </div>
      <div className="text-gray-300 text-sm">{children}</div>
    </div>
  );
}
