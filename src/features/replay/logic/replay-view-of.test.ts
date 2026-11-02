import { describe, expect, it } from 'vitest';
import type { Result } from '@/features/seasons/types/result';
import type { Round } from '@/features/seasons/types/round';
import type { Season } from '@/features/seasons/types/season';
import type { Session } from '@/features/seasons/types/session';
import type { ScoringRule } from '@/features/scoring/types/scoring-rule';
import { replayViewOf } from './replay-view-of';

// Made-up Seasons built from small helpers; every expected value is worked out by hand in its test.

const rule: ScoringRule = {
  code: 'test',
  name: 'Test',
  points: { 'grand-prix-race': [25, 20, 16, 13, 11], sprint: [12, 9, 7, 6, 5] },
  countingWindows: [],
  fastestLapPoints: 0,
  fastestLapRequiresFinish: true,
  source: 'made up',
};

const base = { team: null, manufacturer: null, bikeNumber: null, nationality: null, source: 'test' };

/** finishers('a', 'b') = a wins, b second. Pass a Result for anything unusual. */
function finishers(...order: Array<string | Result>): Result[] {
  return order.map((entry, i) =>
    typeof entry === 'string' ? { ...base, riderId: entry, position: i + 1, outcome: 'FIN' as const } : entry,
  );
}

const fin = (riderId: string, position: number, extra: Partial<Result> = {}): Result =>
  ({ ...base, riderId, position, outcome: 'FIN', ...extra });
const out = (riderId: string, outcome: Result['outcome'], extra: Partial<Result> = {}): Result =>
  ({ ...base, riderId, position: null, outcome, ...extra });

const session = (type: string, order: number, results: Result[]): Session => ({
  type, order, date: null, pointsMultiplier: 1, results,
});
const gp = (...order: Array<string | Result>) => session('grand-prix-race', 2, finishers(...order));
const sprint = (...order: Array<string | Result>) => session('sprint', 1, finishers(...order));

const round = (number: number, sessions: Session[], extra: Partial<Round> = {}): Round => ({
  number, name: `Round ${number}`, circuit: null, country: null, date: null, nonChampionship: false, sessions, ...extra,
});

const season = (rounds: Round[], extra: Partial<Season> = {}): Season => ({
  classCode: 'test', className: 'Test', year: 2000, rule, rounds, riders: {}, ...extra,
});

describe('replayViewOf', () => {
  it('opens on the Participants step: every Participant on 0 points, by name, with no Session and no Podium', () => {
    // 'late' only races in a Non-championship round: still a Participant.
    const view = replayViewOf(season(
      [
        round(1, [gp('b', 'a', out('c', 'DNS'))]),
        round(2, [gp('late')], { nonChampionship: true }),
      ],
      { riders: { a: { name: 'Zed' }, b: { name: 'Alpha' }, c: { name: 'Mid' }, late: { name: 'Bravo' } } },
    ));
    const [participants, first] = view.steps;
    expect(view.steps.map((s) => s.kind)).toEqual(['participants', 'session']);
    expect(participants.standings.map((r) => [r.rank, r.riderId, r.points, r.rankChange, r.gap])).toEqual([
      [1, 'b', 0, 0, null],
      [2, 'late', 0, 0, null],
      [3, 'c', 0, 0, null],
      [4, 'a', 0, 0, null],
    ]);
    expect([participants.round, participants.classification, participants.podium, participants.crowning, participants.worldChampion])
      .toEqual([null, [], [], false, null]);
    expect(first.round?.name).toEqual('Round 1');
  });

  it('lists the Defending Champion first and labels them on every Step until a World Champion is crowned', () => {
    // a is crowned at Round 2 (50 to 20, one Round of 25 left), so 'z' is labelled on the first three Steps.
    const view = replayViewOf(
      season(
        [round(1, [gp('a', 'z')]), round(2, [gp('a')]), round(3, [gp('z', 'a')])],
        { riders: { a: { name: 'Alpha' }, z: { name: 'Zulu' } } },
      ),
      { riderId: 'z', name: 'Zulu' },
    );
    expect(view.steps[0].standings.map((r) => r.riderId)).toEqual(['z', 'a']);
    expect(view.steps.map((s) => s.defendingChampion)).toEqual(['z', 'z', null, null]);
    expect(view.participantsNote).toBeNull();
  });

  it('has a note on the Participants step and no label when the Defending Champion takes no part', () => {
    const view = replayViewOf(season([round(1, [gp('a', 'b')])]), { riderId: 'gone', name: 'Gone Rider' });
    expect(view.steps.map((s) => s.defendingChampion)).toEqual([null, null]);
    expect(view.participantsNote).toEqual('Defending Champion Gone Rider takes no part in this Season.');
  });

  it('has no label and no note in a Season with no Defending Champion', () => {
    const view = replayViewOf(season([round(1, [gp('a', 'b')])]), null);
    expect(view.steps.map((s) => s.defendingChampion)).toEqual([null, null]);
    expect(view.participantsNote).toBeNull();
  });

  it("names each Rider, with the Nationality of their first Result that has one", () => {
    const view = replayViewOf(season(
      [
        round(1, [gp(fin('a', 1, { nationality: 'ITA' }), fin('b', 2))]),
        round(2, [gp(fin('b', 1, { nationality: 'GBR' }), fin('a', 2, { nationality: 'SMR' }))]),
      ],
      { riders: { a: { name: 'Rider A' }, b: { name: 'Rider B' } } },
    ));
    expect(view.riders).toEqual({
      a: { name: 'Rider A', nationality: 'ITA' },
      b: { name: 'Rider B', nationality: 'GBR' },
    });
  });

  it('falls back to the Rider id when the Season has no name for them', () => {
    const view = replayViewOf(season([round(1, [gp('a')])]));
    expect(view.riders.a).toEqual({ name: 'a', nationality: null });
  });

  it("gives each Step its own Session's Classification: finishers by position, then the other Outcomes, labelled", () => {
    const view = replayViewOf(season([
      round(1, [
        sprint('b', 'a'),
        session('grand-prix-race', 2, [
          out('dns', 'DNS'), fin('second', 2), out('nc', 'NC'), fin('first', 1), out('dnf', 'DNF'),
        ]),
      ]),
    ]));
    expect(view.steps.map((s) => s.classification.map((r) => [r.riderId, r.positionLabel, r.outcomeLabel]))).toEqual([
      [],
      [['b', '1', null], ['a', '2', null]],
      [
        ['first', '1', null],
        ['second', '2', null],
        ['nc', '–', 'Not classified'],
        ['dnf', '–', 'Did not finish'],
        ['dns', '–', 'Did not start'],
      ],
    ]);
  });

  it('puts the first three Classified Riders on the Podium, fewer when fewer were Classified', () => {
    const view = replayViewOf(season([
      round(1, [gp('a', 'b', 'c', 'd')]),
      round(2, [session('grand-prix-race', 1, [out('c', 'DNF'), fin('b', 1), out('a', 'NC'), out('d', 'DNS')])]),
    ]));
    expect(view.steps.map((s) => s.podium.map((r) => r.riderId))).toEqual([[], ['a', 'b', 'c'], ['b']]);
  });

  it('marks the crowning only on the Step where the World Champion is crowned', () => {
    // After Round 2 a has 50, b 20, one Round (25) left: b can't catch a, so a is crowned at Round 2's Step.
    const view = replayViewOf(season([round(1, [gp('a', 'b')]), round(2, [gp('a')]), round(3, [gp('b', 'a')])]));
    expect(view.steps.map((s) => [s.worldChampion, s.crowning])).toEqual([
      [null, false],
      [null, false],
      ['a', true],
      ['a', false],
    ]);
  });

  it('shows how each Rider moved since the previous Step and how far behind the leader they are', () => {
    // Round 1: a 25, b 20, c 16 (no movement from the Participants step). Round 2: a 45, c 41, b 36, d 13 (new).
    const view = replayViewOf(season([round(1, [gp('a', 'b', 'c')]), round(2, [gp('c', 'a', 'b', 'd')])]));
    const rows = (i: number) => view.steps[i + 1].standings.map((r) => [r.riderId, r.rankChange, r.gap]);
    expect(rows(0)).toEqual([['a', 0, null], ['b', 0, 5], ['c', 0, 9]]);
    expect(rows(1)).toEqual([['a', 0, null], ['c', 1, 4], ['b', -1, 9], ['d', 0, 32]]);
  });

  it("lists every Round in the calendar, and gives each Step its Round's name, date and note", () => {
    const view = replayViewOf(season([
      round(1, [sprint('a'), gp('a')], { name: 'Qatar', date: '2000-03-10' }),
      round(2, [gp('a')], { name: 'Imola', nonChampionship: true }),
      round(3, [gp('a')], { name: 'Assen', notes: 'Half points' }),
    ]));
    expect(view.calendar.map((e) => [e.name, e.nonChampionship, e.steps])).toEqual([
      ['Qatar', false, 2],
      ['Imola', true, 0],
      ['Assen', false, 1],
    ]);
    expect(view.steps.slice(1).map((s) => [s.round?.name, s.round?.date, s.round?.notes])).toEqual([
      ['Qatar', '2000-03-10', null],
      ['Qatar', '2000-03-10', null],
      ['Assen', null, 'Half points'],
    ]);
  });

  it('tells the page the Season, and whether its Scoring rule has Counting windows or a Fastest-lap bonus', () => {
    const plain = replayViewOf(season([round(1, [gp('a')])], { year: 1999, className: '500cc' }));
    expect([plain.year, plain.className, plain.hasCountingWindows, plain.fastestLapBonus]).toEqual([1999, '500cc', false, false]);
    const early = replayViewOf(season([round(1, [gp('a')])], {
      rule: { ...rule, countingWindows: [{ fromRound: 1, toRound: 1, count: 1 }], fastestLapPoints: 1 },
    }));
    expect([early.hasCountingWindows, early.fastestLapBonus]).toEqual([true, true]);
  });
});
