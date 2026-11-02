import { computeReplay } from '@/features/scoring/logic/compute-replay';
import type { Season } from '@/features/seasons/types/season';
import type { ReplayView } from '../types/replay-view';
import type { RiderInfo } from '../types/rider-info';
import { calendarEntriesOf } from './calendar-entries-of';
import { classificationOf } from './classification-of';
import { belowPodiumOf } from './below-podium-of';
import { podiumOf } from './podium-of';

/** The Replay view of a Season: everything the Season page renders, computed at build time. */
export function replayViewOf(season: Season): ReplayView {
  const replay = computeReplay(season);
  const calendar = calendarEntriesOf(season.rounds, replay);

  const steps = replay.map((step, i) => {
    const session = season.rounds
      .find((r) => r.number === step.roundNumber)
      ?.sessions.find((s) => s.type === step.sessionType);
    const classification = session ? classificationOf(session) : [];
    const prevRank = new Map((replay[i - 1]?.standings ?? []).map((r) => [r.riderId, r.rank]));
    const leader = step.standings[0]?.points ?? 0;
    return {
      ...step,
      round: calendar.find((entry) => entry.roundNumber === step.roundNumber)!,
      standings: step.standings.map((row) => {
        const before = prevRank.get(row.riderId);
        return {
          ...row,
          rankChange: before == null ? 0 : before - row.rank,
          gap: row.rank === 1 ? null : leader - row.points,
        };
      }),
      crowning: step.worldChampion != null && replay[i - 1]?.worldChampion == null,
      classification,
      podium: podiumOf(classification),
      belowPodium: belowPodiumOf(classification),
    };
  });

  return {
    year: season.year,
    className: season.className,
    hasCountingWindows: season.rule.countingWindows.length > 0,
    fastestLapBonus: season.rule.fastestLapPoints > 0,
    riders: ridersOf(season),
    steps,
    calendar,
  };
}

/** A Rider's Nationality is per Season entry: take the one on their first Result that has one. */
function ridersOf(season: Season): Record<string, RiderInfo> {
  const riders: Record<string, RiderInfo> = {};
  for (const round of season.rounds) {
    for (const session of round.sessions) {
      for (const result of session.results) {
        riders[result.riderId] ??= { name: season.riders[result.riderId]?.name ?? result.riderId, nationality: null };
        riders[result.riderId].nationality ??= result.nationality;
      }
    }
  }
  return riders;
}
