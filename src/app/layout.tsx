import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'MotoGP Seasons',
  description: 'Relive every MotoGP season since 1949, round by round.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <main>{children}</main>
          <footer className="site-footer">
            Data from Wikipedia, CC BY-SA 4.0 · <Link href="/attribution/">Attribution</Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
