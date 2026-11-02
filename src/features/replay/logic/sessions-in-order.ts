import type { Season } from '@/features/seasons/types/season';
import type { Session } from '@/features/seasons/types/session';

/**
 * Every Session of the Season in running order (Rounds by number, Sessions by order), with its Round number,
 * so a Rider's "first Result" means the same thing everywhere.
 */
export function sessionsInOrder(season: Season): { roundNumber: number; session: Session }[] {
  return [...season.rounds]
    .sort((a, b) => a.number - b.number)
    .flatMap((round) =>
      [...round.sessions].sort((a, b) => a.order - b.order).map((session) => ({ roundNumber: round.number, session })),
    );
}
