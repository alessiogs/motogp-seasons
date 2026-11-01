import Link from 'next/link';
import { listPremierSeasons } from '@/lib/db';

export default function Home() {
  const seasons = listPremierSeasons();

  // Group by decade: 1940s, 1950s, ...
  const decades = new Map<number, typeof seasons>();
  for (const s of seasons) {
    const d = Math.floor(s.year / 10) * 10;
    decades.set(d, [...(decades.get(d) ?? []), s]);
  }

  return (
    <>
      <h1>MotoGP Seasons</h1>
      <p className="muted">Pick a premier-class season and replay the championship race by race.</p>

      {seasons.length === 0 && <p className="notice">No seasons in the database yet.</p>}

      {[...decades.entries()].map(([decade, list]) => (
        <section key={decade} className="decade">
          <h2>{decade}s</h2>
          <div className="year-grid">
            {list.map((s) => (
              <Link key={s.year} href={`/season/${s.year}/`} className="year-chip" title={s.className}>
                {s.year}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
