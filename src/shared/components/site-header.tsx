'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Seasons' },
  { href: '/how-it-works/', label: 'How it works' },
];

/** Broadcast-style top bar: a slanted red brand plate on a dark bar, with the site's sections on the right. */
export default function SiteHeader() {
  const pathname = usePathname() ?? '/';
  // Season pages live under /<class>/<year>/, so anything but How it works and Attribution belongs to Seasons.
  const isActive = (href: string) =>
    href === '/' ? !pathname.startsWith('/how-it-works') && !pathname.startsWith('/attribution') : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="MotoGP Seasons, all seasons">
          <span className="brand-plate">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-name">MotoGP</span>
          </span>
          <span className="brand-sub">Seasons</span>
        </Link>
        <nav className="site-nav" aria-label="Site">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} className="site-nav-link" aria-current={isActive(href) ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="site-header-stripe" aria-hidden="true" />
    </header>
  );
}
