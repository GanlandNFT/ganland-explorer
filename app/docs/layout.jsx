import DocsLayout from '../../components/DocsLayout';

export const metadata = {
  title: 'Documentation | GANLAND',
  description: 'Complete reference for @GanlandNFT commands and the GAN terminal',
};

export default function Layout({ children }) {
  return <DocsLayout>{children}</DocsLayout>;
}
