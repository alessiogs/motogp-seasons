import Link from 'next/link';
import type { DefendingChampion } from '@/features/seasons/types/defending-champion';
import type { Season } from '@/features/seasons/types/season';
import { replayViewOf } from '../logic/replay-view-of';
import SeasonCalendar from './season-calendar';
import SeasonReplay from './season-replay';

interface Props {
  season: Season;
  defendingChampion: DefendingChampion | null;
}

export default function SeasonView({ season, defendingChampion }: Props) {
  // Everything is computed here, at build time. The client only gets plain JSON.
  const view = replayViewOf(season, defendingChampion);

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
