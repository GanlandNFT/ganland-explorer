export const metadata = {
  title: 'Mint Neural Networkers | GANLAND',
  description: 'Mint your unique Neural Networker mandala on Base. Generative AI art by GAN.',
};

// Mint pages inherit PrivyClientWrapper from root layout
// This layout only provides mint-specific metadata
export default function MintLayout({ children }) {
  return <>{children}</>;
}
