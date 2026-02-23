import '../globals.css';
import PrivyClientWrapper from '../../components/PrivyClientWrapper';

export const metadata = {
  title: 'Mint Neural Networkers | GANLAND',
  description: 'Mint your unique Neural Networker mandala on Base. Generative AI art by GAN.',
};

// Mint pages use their own layout without the global footer
export default function MintLayout({ children }) {
  return (
    <PrivyClientWrapper>
      {children}
    </PrivyClientWrapper>
  );
}
