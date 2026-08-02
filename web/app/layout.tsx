import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://loomstack.vercel.app'),
  title: 'Loomstack — 5,001,816 lines, and a router that makes them usable',
  description:
    'A spec compiler. It weaves five million addressable spec lines into context packs an agent can actually build from, and every line is independently recountable.',
  openGraph: {
    title: 'Loomstack',
    description: '5,001,816 spec lines. Sharded, hashed, and routable into packs a real context window can hold.',
    type: 'website',
  },
  icons: { icon: '/mark.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink antialiased">{children}</body>
    </html>
  );
}
