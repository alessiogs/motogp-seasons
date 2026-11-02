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

  it("stands each Step's first three Classified Riders on the Podium, 2nd left, 1st centre, 3rd right", () => {
    const view = replayViewOf(season([
      round(1, [
        sprint('s1', 's2', 's3'),
        session('grand-prix-race', 2, [
          fin('d', 4), fin('c', 3, { team: 'Team C', manufacturer: 'Honda' }), fin('a', 1), fin('b', 2),
        ]),
      ]),
    ]));
    expect(view.steps.map((s) => s.podium.map((p) => [p.place, p.rider?.riderId ?? null]))).toEqual([
      [[2, 's2'], [1, 's1'], [3, 's3']],
      [[2, 'b'], [1, 'a'], [3, 'c']],
    ]);
    expect(view.steps[1].podium[2].rider).toEqual({ riderId: 'c', team: 'Team C', manufacturer: 'Honda' });
  });

  it('leaves Podium places empty when fewer than three Riders were Classified', () => {
    const view = replayViewOf(season([
      round(1, [session('grand-prix-race', 1, [out('c', 'DNF'), fin('b', 1), out('a', 'NC'), fin('e', 2), out('d', 'DNS')])]),
      round(2, [session('grand-prix-race', 1, [out('c', 'DNF'), fin('b', 1)])]),
    ]));
    expect(view.steps.map((s) => s.podium.map((p) => [p.place, p.rider?.riderId ?? null]))).toEqual([
      [[2, 'e'], [1, 'b'], [3, null]],
      [[2, null], [1, 'b'], [3, null]],
    ]);
  });

  it('lists the rest of the Classification below the Podium: 4th on, then the Riders not Classified', () => {
    const view = replayViewOf(season([
      round(1, [gp('a', 'b', 'c', 'd', 'e')]),
      round(2, [session('grand-prix-race', 1, [out('c', 'DNF'), fin('b', 1), out('a', 'NC'), fin('e', 2)])]),
    ]));
    expect(view.steps.map((s) => s.belowPodium.map((r) => [r.riderId, r.positionLabel]))).toEqual([
      [['d', '4'], ['e', '5']],
      [['a', '–'], ['c', '–']],
    ]);
  });

  it('marks the crowning only on the Step where the World Champion is crowned', () => {
    // After Round 2 a has 50, b 20, one Round (25) left: b can't catch a, so a is crowned at Step 2.
    const view = replayViewOf(season([round(1, [gp('a', 'b')]), round(2, [gp('a')]), round(3, [gp('b', 'a')])]));
    expect(view.steps.map((s) => [s.worldChampion, s.crowning])).toEqual([
      [null, false],
      ['a', true],
      ['a', false],
    ]);
  });

  it('shows how each Rider moved since the previous Step and how far behind the leader they are', () => {
    // Step 1: a 25, b 20, c 16. Step 2: a 45, c 41, b 36, d 13 (new, so no movement).
    const view = replayViewOf(season([round(1, [gp('a', 'b', 'c')]), round(2, [gp('c', 'a', 'b', 'd')])]));
    const rows = (i: number) => view.steps[i].standings.map((r) => [r.riderId, r.rankChange, r.gap]);
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
    expect(view.steps.map((s) => [s.round.name, s.round.date, s.round.notes])).toEqual([
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
