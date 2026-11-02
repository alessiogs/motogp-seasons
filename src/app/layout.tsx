import type { Metadata, Viewport } from 'next';
import { Titillium_Web } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

// Self-hosted by Next at build time, so it works in the static export under any basePath.
const titillium = Titillium_Web({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-titillium',
});

export const metadata: Metadata = {
  title: 'MotoGP Seasons',
  description: 'Relive every MotoGP season since 1949, round by round.',
};

export const viewport: Viewport = {
  themeColor: '#0b0c10',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={titillium.variable}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span className="brand-name">
                MotoGP <span className="brand-accent">Seasons</span>
              </span>
            </Link>
          </div>
        </header>
        <div className="container">
          <main>{children}</main>
          <footer className="site-footer">
            Data from Wikipedia, CC BY-SA 4.0 · <Link href="/attribution/">Attribution</Link> ·{' '}
            <Link href="/how-it-works/">How it works</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
