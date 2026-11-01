import Link from 'next/link';
import { computeSeason } from '@/features/scoring/logic/compute-season';
import type { SeasonData } from '@/features/seasons/types/season-data';
import SeasonReplay from './season-replay';

export default function SeasonView({ season }: { season: SeasonData | null }) {
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
