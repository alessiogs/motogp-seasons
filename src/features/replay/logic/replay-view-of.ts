import { computeReplay } from '@/features/scoring/logic/compute-replay';
import type { DefendingChampion } from '@/features/seasons/types/defending-champion';
import type { Season } from '@/features/seasons/types/season';
import type { ReplayView } from '../types/replay-view';
import type { ReplayViewStep } from '../types/replay-view-step';
import type { RiderInfo } from '../types/rider-info';
import { calendarEntriesOf } from './calendar-entries-of';
import { classificationOf } from './classification-of';
import { belowPodiumOf } from './below-podium-of';
import { boxColoursOf } from './box-colours-of';
import { podiumOf } from './podium-of';
import { seasonNumbersOf } from './season-numbers-of';

/**
 * The Replay view of a Season: everything the Season page renders, computed at build time.
 * The Defending Champion comes from the previous Season (getDefendingChampion); null when there is none.
 */
export function replayViewOf(season: Season, defendingChampion: DefendingChampion | null = null): ReplayView {
  const replay = computeReplay(season);
  const calendar = calendarEntriesOf(season.rounds, replay);
  const seasonNumbers = seasonNumbersOf(season);
  const riders = ridersOf(season, seasonNumbers);
  const defending = defendingChampion && riders[defendingChampion.riderId] ? defendingChampion.riderId : null;
  const latestColours = latestTeamColours(season);

  const sessionSteps = replay.map((step, i): ReplayViewStep => {
    const session = season.rounds
      .find((r) => r.number === step.roundNumber)
      ?.sessions.find((s) => s.type === step.sessionType);
    const classification = session ? classificationOf(session, seasonNumbers) : [];
    const prevRank = new Map((replay[i - 1]?.standings ?? []).map((r) => [r.riderId, r.rank]));
    const leader = step.standings[0]?.points ?? 0;
    const colours = latestColours(step.roundNumber, step.sessionType);
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
          box: boxColoursOf(colours.get(row.riderId)),
        };
      }),
      crowning: step.worldChampion != null && replay[i - 1]?.worldChampion == null,
      defendingChampion: step.worldChampion == null ? defending : null,
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
    riders,
    participantsNote:
      defendingChampion && !defending ? `Defending Champion ${defendingChampion.name} takes no part in this Season.` : null,
    steps: [participantsStep(riders, defending, firstTeamColours(season)), ...sessionSteps],
    calendar,
  };
}

/**
 * The first Step, before any Session: every Participant on 0 points, the Defending Champion first,
 * then by Season number, then by name.
 */
function participantsStep(
  riders: Record<string, RiderInfo>,
  defending: string | null,
  colours: Map<string, string | null>,
): ReplayViewStep {
  const order = Object.keys(riders).sort(
    (a, b) =>
      Number(b === defending) - Number(a === defending) ||
      (riders[a].seasonNumber ?? 0) - (riders[b].seasonNumber ?? 0) ||
      riders[a].name.localeCompare(riders[b].name),
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
      box: boxColoursOf(colours.get(riderId)),
    })),
    worldChampion: null,
    titleChances: [],
    titleConditions: [],
    crowning: false,
    defendingChampion: defending,
    classification: [],
    podium: [],
    belowPodium: [],
  };
}

/** Every Session of the Season in running order, with its Round number. */
function sessionsInOrder(season: Season) {
  return [...season.rounds]
    .sort((a, b) => a.number - b.number)
    .flatMap((round) => [...round.sessions].sort((a, b) => a.order - b.order).map((session) => ({ roundNumber: round.number, session })));
}

/** Each Rider's Team colour on their first Result: the Participants step shows the Team they start with. */
function firstTeamColours(season: Season): Map<string, string | null> {
  const colours = new Map<string, string | null>();
  for (const { session } of sessionsInOrder(season)) {
    for (const result of session.results) {
      if (!colours.has(result.riderId)) colours.set(result.riderId, result.teamColour ?? null);
    }
  }
  return colours;
}

/**
 * A lookup, called with the Steps in order, from a Step's Session to each Rider's Team colour on their latest Result
 * up to and including it, so a Rider who changes Team shows the new colour from that Step on.
 */
function latestTeamColours(season: Season): (roundNumber: number, sessionType: string) => Map<string, string | null> {
  const sessions = sessionsInOrder(season);
  const colours = new Map<string, string | null>();
  let next = 0;
  return (roundNumber, sessionType) => {
    while (next < sessions.length) {
      const { roundNumber: number, session } = sessions[next++];
      for (const result of session.results) colours.set(result.riderId, result.teamColour ?? null);
      if (number === roundNumber && session.type === sessionType) break;
    }
    return new Map(colours);
  };
}

/** A Rider's Nationality is per Season entry: take the one on their first Result that has one. */
function ridersOf(season: Season, seasonNumbers: Map<string, number>): Record<string, RiderInfo> {
  const riders: Record<string, RiderInfo> = {};
  for (const round of season.rounds) {
    for (const session of round.sessions) {
      for (const result of session.results) {
        riders[result.riderId] ??= {
          name: season.riders[result.riderId]?.name ?? result.riderId,
          nationality: null,
          seasonNumber: seasonNumbers.get(result.riderId) ?? null,
        };
        riders[result.riderId].nationality ??= result.nationality;
      }
    }
  }
  return riders;
}
