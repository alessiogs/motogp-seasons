import { computeReplay } from '@/features/scoring/logic/compute-replay';
import type { DefendingChampion } from '@/features/seasons/types/defending-champion';
import type { Season } from '@/features/seasons/types/season';
import type { Session } from '@/features/seasons/types/session';
import type { ParticipantsStep } from '../types/participants-step';
import type { ReplayView } from '../types/replay-view';
import type { RiderInfo } from '../types/rider-info';
import type { SessionStep } from '../types/session-step';
import { calendarEntriesOf } from './calendar-entries-of';
import { classificationOf } from './classification-of';
import { belowPodiumOf } from './below-podium-of';
import { boxColoursOf } from './box-colours-of';
import { podiumOf } from './podium-of';
import { seasonNumbersOf } from './season-numbers-of';
import { sessionsInOrder } from './sessions-in-order';

/**
 * The Replay view of a Season: everything the Season page renders, computed at build time.
 * The Defending Champion comes from the previous Season (defendingChampionOf); null when there is none.
 */
export function replayViewOf(season: Season, defendingChampion: DefendingChampion | null): ReplayView {
  const replay = computeReplay(season);
  const calendar = calendarEntriesOf(season.rounds, replay);
  const seasonNumbers = seasonNumbersOf(season);
  const sessions = sessionsInOrder(season);
  const riders = ridersOf(season, sessions, seasonNumbers);
  const defending = defendingChampion && riders[defendingChampion.riderId] ? defendingChampion.riderId : null;
  const latestColours = latestTeamColours(sessions);

  const sessionSteps = replay.map((step, i): SessionStep => {
    const { session, colours } = latestColours(step.roundNumber, step.sessionType);
    const classification = classificationOf(session, seasonNumbers);
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
          box: boxColoursOf(colours.get(row.riderId)),
        };
      }),
      crowning: step.worldChampion != null && replay[i - 1]?.worldChampion == null,
      defendingChampion: step.worldChampion == null ? defending : null,
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
    steps: [participantsStep(riders, defending, firstTeamColours(sessions)), ...sessionSteps],
    calendar,
  };
}

/**
 * The first Step, before any Session: every Participant on 0 points, the Defending Champion first,
 * then by Season number (Riders without one after those with one), then by name.
 */
function participantsStep(
  riders: Record<string, RiderInfo>,
  defending: string | null,
  colours: Map<string, string | null>,
): ParticipantsStep {
  const numberOf = (id: string) => riders[id].seasonNumber ?? Infinity;
  const order = Object.keys(riders).sort(
    (a, b) =>
      Number(b === defending) - Number(a === defending) ||
      (numberOf(a) === numberOf(b) ? 0 : numberOf(a) - numberOf(b)) ||
      riders[a].name.localeCompare(riders[b].name),
  );
  return {
    kind: 'participants',
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
    defendingChampion: defending,
  };
}

type OrderedSession = { roundNumber: number; session: Session };

/** Each Rider's Team colour on their first Result: the Participants step shows the Team they start with. */
function firstTeamColours(sessions: OrderedSession[]): Map<string, string | null> {
  const colours = new Map<string, string | null>();
  for (const { session } of sessions) {
    for (const result of session.results) {
      if (!colours.has(result.riderId)) colours.set(result.riderId, result.teamColour ?? null);
    }
  }
  return colours;
}

/**
 * A lookup, called with the Steps in order, from a Step's Session to that Session and each Rider's Team colour on
 * their latest Result up to and including it, so a Rider who changes Team shows the new colour from that Step on.
 * Throws when the Session is not found after the previous one.
 */
function latestTeamColours(
  sessions: OrderedSession[],
): (roundNumber: number, sessionType: string) => { session: Session; colours: Map<string, string | null> } {
  const colours = new Map<string, string | null>();
  let next = 0;
  return (roundNumber, sessionType) => {
    while (next < sessions.length) {
      const { roundNumber: number, session } = sessions[next++];
      for (const result of session.results) colours.set(result.riderId, result.teamColour ?? null);
      if (number === roundNumber && session.type === sessionType) return { session, colours: new Map(colours) };
    }
    throw new Error(`Replay Step for Round ${roundNumber} ${sessionType}: no such Session after the previous Step's`);
  };
}

/** A Rider's Nationality is per Season entry: take the one on their first Result that has one. */
function ridersOf(
  season: Season,
  sessions: OrderedSession[],
  seasonNumbers: Map<string, number>,
): Record<string, RiderInfo> {
  const riders: Record<string, RiderInfo> = {};
  for (const { session } of sessions) {
    for (const result of session.results) {
      riders[result.riderId] ??= {
        name: season.riders[result.riderId]?.name ?? result.riderId,
        nationality: null,
        seasonNumber: seasonNumbers.get(result.riderId) ?? null,
      };
      riders[result.riderId].nationality ??= result.nationality;
    }
  }
  return riders;
}
