import Link from 'next/link';
import { getPremierSeason, listPremierSeasons } from '@/lib/db';
import { computeSeason } from '@/lib/standings';
import SeasonReplay from './SeasonReplay';

// Placeholder used only while the database has no seasons: static export
// fails if a dynamic route generates zero pages.
const EMPTY = 'none';

export const dynamicParams = false;

export function generateStaticParams() {
  const seasons = listPremierSeasons();
  if (seasons.length === 0) return [{ year: EMPTY }];
  return seasons.map((s) => ({ year: String(s.year) }));
}

export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  const season = year === EMPTY ? null : getPremierSeason(Number(year));

  if (!season) {
    return (
      <>
        <Link href="/">← All seasons</Link>
        <p className="notice">No data for this season yet.</p>
      </>
    );
  }

  // Everything is computed here, at build time. The client only gets plain JSON.
  const standings = computeSeason(season.results, season.rule);

  return (
    <>
      <Link href="/">← All seasons</Link>
      <h1>
        {season.year} <span className="muted">{season.className}</span>
      </h1>
      <SeasonReplay rounds={season.rounds} riders={season.riders} standings={standings} />
    </>
  );
}
