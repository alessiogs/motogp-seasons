import { computeReplay } from '@/features/scoring/logic/compute-replay';
import type { DefendingChampion } from '@/features/seasons/types/defending-champion';
import type { Season } from '@/features/seasons/types/season';
import type { ReplayView } from '../types/replay-view';
import type { ReplayViewStep } from '../types/replay-view-step';
import type { RiderInfo } from '../types/rider-info';
import { calendarEntriesOf } from './calendar-entries-of';
import { classificationOf } from './classification-of';
import { podiumOf } from './podium-of';

/**
 * The Replay view of a Season: everything the Season page renders, computed at build time.
 * The Defending Champion comes from the previous Season (getDefendingChampion); null when there is none.
 */
export function replayViewOf(season: Season, defendingChampion: DefendingChampion | null = null): ReplayView {
  const replay = computeReplay(season);
  const calendar = calendarEntriesOf(season.rounds, replay);
  const riders = ridersOf(season);
  const defending = defendingChampion && riders[defendingChampion.riderId] ? defendingChampion.riderId : null;

  const sessionSteps = replay.map((step, i): ReplayViewStep => {
    const session = season.rounds
      .find((r) => r.number === step.roundNumber)
      ?.sessions.find((s) => s.type === step.sessionType);
    const classification = session ? classificationOf(session) : [];
    const prevRank = new Map((replay[i - 1]?.standings ?? []).map((r) => [r.riderId, r.rank]));
    const leader = step.standings[0]?.points ?? 0;
    return {
      ...step,
      kind: 'session',
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
      defendingChampion: step.worldChampion == null ? defending : null,
      classification,
      podium: podiumOf(classification),
    };
  });

  return {
    year: season.year,
    className: season.className,
    hasCountingWindows: season.rule.countingWindows.length > 0,
    fastestLapBonus: season.rule.fastestLapPoints > 0,
    riders,
    participantsNote:
      defendingChampion && !defending ? `Defending Champion ${defendingChampion.name} takes no part in this Season.` : null,
    steps: [participantsStep(riders, defending), ...sessionSteps],
    calendar,
  };
}

/** The first Step, before any Session: every Participant on 0 points, the Defending Champion first, then by name. */
function participantsStep(riders: Record<string, RiderInfo>, defending: string | null): ReplayViewStep {
  // Season numbers (ticket #25) slot in between the Defending Champion and the name.
  const order = Object.keys(riders).sort(
    (a, b) => Number(b === defending) - Number(a === defending) || riders[a].name.localeCompare(riders[b].name),
  );
  return {
    kind: 'participants',
    roundNumber: 0,
    sessionType: '',
    sessionsInRound: 0,
    round: null,
    standings: order.map((riderId, i) => ({
      rank: i + 1,
      riderId,
      points: 0,
      grossPoints: 0,
      roundScores: [],
      droppedRounds: [],
      wins: 0,
      podiums: 0,
      rankChange: 0,
      gap: null,
    })),
    worldChampion: null,
    titleChances: [],
    titleConditions: [],
    crowning: false,
    defendingChampion: defending,
    classification: [],
    podium: [],
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
