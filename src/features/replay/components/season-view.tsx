import Link from 'next/link';
import { defendingChampionOf } from '@/features/seasons/logic/defending-champion-of';
import type { Season } from '@/features/seasons/types/season';
import { replayViewOf } from '../logic/replay-view-of';
import SeasonCalendar from './season-calendar';
import SeasonReplay from './season-replay';

interface Props {
  season: Season;
  /** The previous Season in the same Category, whose World Champion is this Season's Defending Champion. */
  previousSeason: Season | null;
}

export default function SeasonView({ season, previousSeason }: Props) {
  // Everything is computed here, at build time. The client only gets plain JSON.
  const view = replayViewOf(season, defendingChampionOf(previousSeason));

  return (
    <>
      <Link href="/">← All seasons</Link>
      <h1>
        {view.year} <span className="muted">{view.className}</span>
      </h1>
      <SeasonReplay view={view} />
      <SeasonCalendar calendar={view.calendar} />
    </>
  );
}
