import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getSeason } from '@/features/seasons/queries/get-season';
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
      a: { name: 'Rider A', nationality: 'ITA', seasonNumber: null },
      b: { name: 'Rider B', nationality: 'GBR', seasonNumber: null },
    });
  });

  it('falls back to the Rider id when the Season has no name for them', () => {
    const view = replayViewOf(season([round(1, [gp('a')])]));
    expect(view.riders.a).toEqual({ name: 'a', nationality: null, seasonNumber: null });
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
      [],
      [[2, 's2'], [1, 's1'], [3, 's3']],
      [[2, 'b'], [1, 'a'], [3, 'c']],
    ]);
    expect(view.steps[2].podium[2].rider).toEqual({
      riderId: 'c', team: 'Team C', manufacturer: 'Honda', bikeNumber: null, numberException: false,
      box: { background: '#5a606c', foreground: '#ffffff' },
    });
  });

  it("shows each Podium Rider with that Result's own Bike number and Team colour, marked when it isn't their Season number", () => {
    // a: 46, 46, 58 -> Season number 46; on the Round 3 Podium a carried 58 on a yellow bike.
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { bikeNumber: 46 }), fin('b', 2, { bikeNumber: 4 }))]),
      round(2, [gp(fin('a', 1, { bikeNumber: 46 }), fin('b', 2, { bikeNumber: 4 }))]),
      round(3, [gp(fin('b', 1, { bikeNumber: 4 }), fin('a', 2, { bikeNumber: 58, teamColour: '#ffcc00' }))]),
    ]));
    expect(view.steps[3].podium.map((p) => p.rider && [p.rider.riderId, p.rider.bikeNumber, p.rider.numberException, p.rider.box.background]))
      .toEqual([['a', 58, true, '#ffcc00'], ['b', 4, false, '#5a606c'], null]);
  });

  it('shows the known Bike numbers on the Podium in a Season without Season numbers, with no exception marked', () => {
    // b has no number in Round 2, so the Season has no Season numbers.
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { bikeNumber: 7 }), fin('b', 2, { bikeNumber: 3 }))]),
      round(2, [gp(fin('a', 1, { bikeNumber: 11 }), fin('b', 2))]),
    ]));
    expect(view.steps[2].podium.map((p) => p.rider && [p.rider.riderId, p.rider.bikeNumber, p.rider.numberException]))
      .toEqual([['b', null, false], ['a', 11, false], null]);
  });

  it('leaves Podium places empty when fewer than three Riders were Classified', () => {
    const view = replayViewOf(season([
      round(1, [session('grand-prix-race', 1, [out('c', 'DNF'), fin('b', 1), out('a', 'NC'), fin('e', 2), out('d', 'DNS')])]),
      round(2, [session('grand-prix-race', 1, [out('c', 'DNF'), fin('b', 1)])]),
    ]));
    expect(view.steps.map((s) => s.podium.map((p) => [p.place, p.rider?.riderId ?? null]))).toEqual([
      [],
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
      [],
      [['d', '4'], ['e', '5']],
      [['a', '–'], ['c', '–']],
    ]);
  });

  it("gives each Rider the Bike number on more than half of their Results as their Season number", () => {
    // a: 46, 46, 58 (one-off) -> 46. b: 4, 4 -> 4. c: one Result, 7 -> 7.
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { bikeNumber: 46 }), fin('b', 2, { bikeNumber: 4 }), fin('c', 3, { bikeNumber: 7 }))]),
      round(2, [gp(fin('b', 1, { bikeNumber: 4 }), fin('a', 2, { bikeNumber: 46 }))]),
      round(3, [gp(fin('a', 1, { bikeNumber: 58 }))]),
    ]));
    expect(Object.entries(view.riders).map(([id, r]) => [id, r.seasonNumber])).toEqual([['a', 46], ['b', 4], ['c', 7]]);
  });

  it('shows no Season numbers when any Result lacks a Bike number, or any Rider has no majority number', () => {
    const numbersOf = (rounds: Round[]) =>
      Object.values(replayViewOf(season(rounds)).riders).map((r) => r.seasonNumber);
    // b's second Result has no number: nobody gets one, a included.
    expect(numbersOf([
      round(1, [gp(fin('a', 1, { bikeNumber: 1 }), fin('b', 2, { bikeNumber: 2 }))]),
      round(2, [gp(fin('a', 1, { bikeNumber: 1 }), fin('b', 2))]),
    ])).toEqual([null, null]);
    // b carried 2 and 9 once each: half is not more than half, so the Season has none.
    expect(numbersOf([
      round(1, [gp(fin('a', 1, { bikeNumber: 1 }), fin('b', 2, { bikeNumber: 2 }))]),
      round(2, [gp(fin('a', 1, { bikeNumber: 1 }), fin('b', 2, { bikeNumber: 9 }))]),
    ])).toEqual([null, null]);
  });

  it("shows each Result's own Bike number in the Classification, marked when it differs from the Season number", () => {
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { bikeNumber: 46 }), fin('b', 2, { bikeNumber: 4 }))]),
      round(2, [gp(fin('a', 1, { bikeNumber: 46 }), fin('b', 2, { bikeNumber: 4 }))]),
      round(3, [gp(fin('b', 1, { bikeNumber: 4 }), out('a', 'DNF', { bikeNumber: 58 }))]),
    ]));
    expect(view.steps[3].classification.map((r) => [r.riderId, r.bikeNumber, r.numberException])).toEqual([
      ['b', 4, false],
      ['a', 58, true],
    ]);
  });

  it('marks no exceptions in a Season without Season numbers, and shows the Bike numbers it knows', () => {
    // b's number is missing in Round 2, so the Season has none, though a changed number.
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { bikeNumber: 7 }), fin('b', 2, { bikeNumber: 3 }))]),
      round(2, [gp(fin('a', 1, { bikeNumber: 11 }), fin('b', 2))]),
    ]));
    expect(view.steps[2].classification.map((r) => [r.riderId, r.bikeNumber, r.numberException])).toEqual([
      ['a', 11, false],
      ['b', null, false],
    ]);
  });

  it("fills each Classification row's box with its own Result's Team colour, grey when unknown, with contrasting text", () => {
    // a changes Team between Rounds: Round 2's row shows the yellow one. Yellow takes black text, red white, grey white.
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { teamColour: '#cc0000' }), fin('b', 2))]),
      round(2, [gp(fin('a', 1, { teamColour: '#ffcc00' }), fin('b', 2, { teamColour: null }), fin('c', 3, { teamColour: '#cc0000' }))]),
    ]));
    expect(view.steps[2].classification.map((r) => [r.riderId, r.box])).toEqual([
      ['a', { background: '#ffcc00', foreground: '#000000' }],
      ['b', { background: '#5a606c', foreground: '#ffffff' }],
      ['c', { background: '#cc0000', foreground: '#ffffff' }],
    ]);
  });

  it("fills each Standings box with the Team colour of the Rider's latest Result so far, the first one on the Participants step", () => {
    // a: red in Round 1, yellow from Round 2's Sprint. b: grey (no colour) in Round 1, then absent from the Sprint,
    // then blue in Round 2's race, so b stays grey at the Sprint's Step.
    const view = replayViewOf(season([
      round(1, [gp(fin('a', 1, { teamColour: '#cc0000' }), fin('b', 2))]),
      round(2, [
        session('sprint', 1, [fin('a', 1, { teamColour: '#ffcc00' })]),
        session('grand-prix-race', 2, [fin('b', 1, { teamColour: '#0033aa' }), fin('a', 2, { teamColour: '#ffcc00' })]),
      ]),
    ]));
    const boxes = (i: number) =>
      Object.fromEntries(view.steps[i].standings.map((r) => [r.riderId, r.box.background]));
    expect([0, 1, 2, 3].map(boxes)).toEqual([
      { a: '#cc0000', b: '#5a606c' },
      { a: '#cc0000', b: '#5a606c' },
      { a: '#ffcc00', b: '#5a606c' },
      { a: '#ffcc00', b: '#0033aa' },
    ]);
    expect(view.steps[2].standings.find((r) => r.riderId === 'a')?.box.foreground).toEqual('#000000');
  });

  it('orders the Participants by Defending Champion, then Season number, then name', () => {
    // champ carries 93 but defends, so comes first; then 4, 12, 46, though by name 46 (Aaa) would lead.
    const view = replayViewOf(
      season(
        [round(1, [gp(
          fin('vr', 1, { bikeNumber: 46 }), fin('ad', 2, { bikeNumber: 4 }),
          fin('champ', 3, { bikeNumber: 93 }), fin('jm', 4, { bikeNumber: 12 }),
        )])],
        { riders: { vr: { name: 'Aaa' }, ad: { name: 'Zzz' }, champ: { name: 'Mmm' }, jm: { name: 'Bbb' } } },
      ),
      { riderId: 'champ', name: 'Mmm' },
    );
    expect(view.steps[0].standings.map((r) => r.riderId)).toEqual(['champ', 'ad', 'jm', 'vr']);
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

describe('replayViewOf on real Seasons', () => {
  beforeAll(() => {
    const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-real-')), 'real.db');
    buildDatabase(path.join(process.cwd(), 'data'), dbPath);
    process.env.MOTOGP_DB_PATH = dbPath;
  });

  it.each([
    ['500cc', 1949],
    ['500cc', 1976],
    ['500cc', 1989],
  ])('shows no Season numbers in %s %i, where numbers are missing or changed between Rounds', (classCode, year) => {
    const view = replayViewOf(getSeason(classCode, year)!);
    expect(Object.values(view.riders).filter((r) => r.seasonNumber !== null)).toEqual([]);
  });

  it.each([
    ['500cc', 1949],
    ['500cc', 1976],
    ['500cc', 1989],
    ['motogp', 2024],
  ])('has a Team colour for every Result of %s %i that names a Team or Manufacturer', (classCode, year) => {
    const results = getSeason(classCode, year)!.rounds.flatMap((r) => r.sessions.flatMap((s) => s.results));
    const uncoloured = results.filter((r) => (r.team != null || r.manufacturer != null) && r.teamColour == null);
    expect(uncoloured.map((r) => [r.team, r.manufacturer])).toEqual([]);
  });

  it("gives the four 2024 Ducati Teams four colours of their own, not their Manufacturer's", () => {
    const season = getSeason('motogp', 2024)!;
    const results = season.rounds.flatMap((r) => r.sessions.flatMap((s) => s.results));
    const ducatis = new Set(results.filter((r) => r.manufacturer === 'Ducati').map((r) => r.teamColour));
    expect(ducatis.size).toEqual(4);
  });

  it('gives every 2024 MotoGP Participant a Season number', () => {
    const { riders } = replayViewOf(getSeason('motogp', 2024)!);
    expect(Object.values(riders).filter((r) => r.seasonNumber === null)).toEqual([]);
    expect([riders['francesco-bagnaia'].seasonNumber, riders['marc-marquez'].seasonNumber]).toEqual([1, 93]);
  });
});
