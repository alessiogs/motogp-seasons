import Link from 'next/link';
import type { SeasonSummary } from '../types/season-summary';

/** Seasons grouped by Class, in the order given (Classes ordered by Category). */
export default function SeasonList({ seasons }: { seasons: SeasonSummary[] }) {
  const byClass = new Map<string, { name: string; seasons: SeasonSummary[] }>();
  for (const s of seasons) {
    const entry = byClass.get(s.classCode) ?? { name: s.className, seasons: [] };
    entry.seasons.push(s);
    byClass.set(s.classCode, entry);
  }

  return (
    <>
      <h1>MotoGP Seasons</h1>
      <p className="muted">Pick a season and replay the championship session by session.</p>

      {seasons.length === 0 && <p className="notice">No seasons in the database yet.</p>}

      {[...byClass.entries()].map(([classCode, { name, seasons: list }]) => (
        <section key={classCode} className="decade">
          <h2>{name}</h2>
          <div className="year-grid">
            {list.map((s) => (
              <Link key={s.year} href={`/${classCode}/${s.year}/`} className="year-chip">
                {s.year}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
