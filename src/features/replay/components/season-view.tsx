import Link from 'next/link';
import type { Season } from '@/features/seasons/types/season';
import { replayViewOf } from '../logic/replay-view-of';
import SeasonCalendar from './season-calendar';
import SeasonReplay from './season-replay';

export default function SeasonView({ season }: { season: Season }) {
  // Everything is computed here, at build time. The client only gets plain JSON.
  const view = replayViewOf(season);

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
