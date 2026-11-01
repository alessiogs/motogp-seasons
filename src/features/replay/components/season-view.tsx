import Link from 'next/link';
import { computeReplay } from '@/features/scoring/logic/compute-replay';
import type { Season } from '@/features/seasons/types/season';
import SeasonReplay from './season-replay';

export default function SeasonView({ season }: { season: Season }) {
  // Everything is computed here, at build time. The client only gets plain JSON.
  const steps = computeReplay(season);

  // A Rider's Nationality is per Season entry: take the one on their first Result.
  const riders: Record<string, { name: string; nationality: string | null }> = {};
  for (const round of season.rounds) {
    for (const session of round.sessions) {
      for (const result of session.results) {
        riders[result.riderId] ??= { name: season.riders[result.riderId]?.name ?? result.riderId, nationality: null };
        riders[result.riderId].nationality ??= result.nationality;
      }
    }
  }

  const rounds = season.rounds.map(({ number, name, date }) => ({ number, name, date }));

  return (
    <>
      <Link href="/">← All seasons</Link>
      <h1>
        {season.year} <span className="muted">{season.className}</span>
      </h1>
      <SeasonReplay rounds={rounds} riders={riders} steps={steps} hasCountingWindows={season.rule.countingWindows.length > 0} />
    </>
  );
}
