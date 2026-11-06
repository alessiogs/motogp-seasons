import { describe, it, expect } from 'vitest';
import { computeReplay } from './compute-replay';
import type { Season } from '@/features/seasons/types/season';
import type { Round } from '@/features/seasons/types/round';
import type { Session } from '@/features/seasons/types/session';
import type { Result } from '@/features/seasons/types/result';
import type { ScoringRule } from '../types/scoring-rule';

// World Champion, Title chance and Title condition through the scoring seam, on made-up Seasons.
// Every expected value is worked out by hand in its test.

const modern: ScoringRule = {
  code: 'test-modern',
  name: 'Test modern',
  points: {
    'grand-prix-race': [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    sprint: [12, 9, 7, 6, 5, 4, 3, 2, 1],
  },
  countingWindows: [],
  fastestLapPoints: 0,
  fastestLapRequiresFinish: true,
  source: 'made up',
};

/** Only the top two score: 10 and 5. Keeps hand calculations short. */
const twoPlaces: ScoringRule = { ...modern, code: 'test-two', points: { 'grand-prix-race': [10, 5] } };

const base = { team: null, manufacturer: null, bikeNumber: null, nationality: null, source: 'test' };

const at = (riderId: string, position: number): Result => ({ ...base, riderId, position, outcome: 'FIN' });
const retired = (riderId: string): Result => ({ ...base, riderId, position: null, outcome: 'DNF' });

/** finishers('a', 'b') = a wins, b second. Pass a Result for anything unusual. */
function finishers(...order: Array<string | Result>): Result[] {
  return order.map((entry, i) => (typeof entry === 'string' ? at(entry, i + 1) : entry));
}

const session = (type: string, order: number, res: Result[]): Session => ({
  type, order, date: null, pointsMultiplier: 1, results: res,
});
const gp = (...order: Array<string | Result>) => session('grand-prix-race', 2, finishers(...order));
const sprint = (...order: Array<string | Result>) => session('sprint', 1, finishers(...order));
const round = (number: number, sessions: Session[]): Round => ({
  number, name: `Round ${number}`, circuit: null, country: null, date: null, nonChampionship: false, sessions,
});
const season = (rounds: Round[], rule: ScoringRule = modern): Season => ({
  classCode: 'test', className: 'Test', year: 2000, rule, rounds, riders: {},
});

const champions = (s: Season) => computeReplay(s).map((step) => step.worldChampion);

describe('World Champion', () => {
  it('is crowned at the first Step after which no rival can reach the leader, and stays crowned', () => {
    // After Round 1: a 10, b 0, two Rounds (20 points) left: b can still pass.
    // After Round 2: a 20, b 0, one Round (10) left: b can reach 10 at most.
    const s = season([
      round(1, [gp('a', retired('b'))]),
      round(2, [gp('a', retired('b'))]),
      round(3, [gp('b', 'a')]),
    ], twoPlaces);
    expect(champions(s)).toEqual([null, 'a', 'a']);
  });

  it('is crowned when the best a rival can do is tie on points and lose the tie-break', () => {
    // After Round 2: a 20 (two wins), b 10 (two seconds), one Round (10) left.
    // b can at best tie on 20 with one win against a's two: Countback keeps a ahead.
    const s = season([
      round(1, [gp('a', 'b')]),
      round(2, [gp('a', 'b')]),
      round(3, [gp('b', 'a')]),
    ], twoPlaces);
    expect(champions(s)).toEqual([null, 'a', 'a']);
  });

  it('is not crowned while a rival could tie on points and win the tie-break', () => {
    // After Round 1: a 10, b 0, one Round (10) left. If b wins it and a scores nothing, both have
    // 10 points and one win: Countback is level and b's win is the later one (Latest-best).
    const s = season([
      round(1, [gp('a', retired('b'))]),
      round(2, [gp('b', retired('a'))]),
    ], twoPlaces);
    expect(champions(s)).toEqual([null, 'b']);
  });

  it('can be crowned at a Sprint, before the Grand Prix race of the same Round', () => {
    // After Round 1: a 37 (Sprint and Grand Prix race wins), b 22 (Sprint 4th 6, Grand Prix race 3rd 16).
    // After the Round 2 Sprint (a wins 12, b scores nothing): a 49, b 22. Only the Grand Prix race (25)
    // is left: b can reach 47 at most.
    const s = season([
      round(1, [sprint('a', at('b', 4)), gp('a', at('b', 3))]),
      round(2, [sprint('a', retired('b')), gp('b', 'a')]),
    ]);
    expect(champions(s)).toEqual([null, null, 'a', 'a']);
  });
});

describe('Title chance', () => {
  const chances = (s: Season) => computeReplay(s).map((step) => step.titleChances);

  it('goes to every Rider who can be crowned by the end of the next Round, at the Step before it', () => {
    // After Round 1 (a 10, b 5, c 0), Round 2 is the last:
    // a is crowned if he wins; b if he wins and a scores nothing (15 v 10);
    // c if he wins and a and b score nothing (10 v 10, Countback level, c's win is the later one).
    const s = season([
      round(1, [gp('a', 'b', retired('c'))]),
      round(2, [gp('a', 'b', retired('c'))]),
    ], twoPlaces);
    expect(chances(s)).toEqual([['a', 'b', 'c'], []]);
  });

  it('is announced only before a Round where someone can be crowned, and not after the crowning', () => {
    const s = season([
      round(1, [gp('a', 'b')]),
      round(2, [gp('a', 'b')]),
      round(3, [gp('a', 'b')]),
      round(4, [gp('a', 'b')]),
    ], twoPlaces);
    // After Round 1 (a 10, b 5, 30 left): a winning Round 2 makes 20 v 5 and b can still reach 25.
    // After Round 2 (a 20, b 10, 20 left): a winning Round 3 makes 30 v 10 with 10 left; b winning it
    // makes 20 v 20 with 10 left, so only a. a is crowned after Round 3 (30 v 15, 10 left).
    expect(chances(s)).toEqual([[], ['a'], [], []]);
  });

  it('is announced before the Round, not between its Sprint and its Grand Prix race', () => {
    // Same Season as the Sprint crowning above. After Round 1: a 37, b 22, and Round 2 is the last:
    // a can be crowned, and so can b by winning both Sessions while a scores nothing (59 v 37).
    const s = season([
      round(1, [sprint('a', at('b', 4)), gp('a', at('b', 3))]),
      round(2, [sprint('a', retired('b')), gp('b', 'a')]),
    ]);
    expect(chances(s)).toEqual([[], ['a', 'b'], [], []]);
  });
});

describe('Title condition', () => {
  const conditions = (s: Season, step: number) => computeReplay(s)[step].titleConditions;

  it('states the margin over each rival who can still catch him, omitting those who cannot', () => {
    // After Round 2: a 15 (win, 2nd), c 10 (win), b 5 (2nd), d 0. Round 3 is the last.
    // b catches a only by winning while a scores nothing (15 v 15, b's win is the later one): a must not
    // be outscored by b by 10, so b may outscore him by 5 at most.
    // c catches a by winning while a is 2nd (20 v 20, c has two wins) or by being 2nd while a scores
    // nothing (15 v 15, c's win is the later one): c must not outscore him at all.
    // d cannot reach 15.
    const s = season([
      round(1, [gp('a', 'b', retired('c'), retired('d'))]),
      round(2, [gp('c', 'a')]),
      round(3, [gp('c', 'a')]),
    ], twoPlaces);
    expect(conditions(s, 1).find((c) => c.riderId === 'a')).toEqual({
      riderId: 'a',
      kind: 'margin',
      rivals: [
        { rivalId: 'c', margin: 0 },
        { rivalId: 'b', margin: -5 },
      ],
    });
  });

  it('states "by N, or by N-1 if he wins" when the tie-break turns on his winning', () => {
    // After Round 1: a 37 (Sprint win, Grand Prix race win), b 29 (two 2nd places). Rounds 2 and 3 have a
    // Grand Prix race only, so after Round 2 b can add 25 at most: a needs to outscore b by 17 to tie.
    // On a tie b has won Round 3. If a won Round 2 (b 8th), a has two wins to b's one: champion.
    // If a was 2nd (b 13th), each has a win and a 2nd place, and b's 13th place breaks the tie: not.
    const s = season([
      round(1, [sprint('a', 'b'), gp('a', 'b')]),
      round(2, [gp('a', 'b')]),
      round(3, [gp('b', 'a')]),
    ]);
    expect(conditions(s, 1)).toEqual([
      { riderId: 'a', kind: 'margin', rivals: [{ rivalId: 'b', margin: 18, marginIfWins: 17 }] },
    ]);
  });

  it('is given for the next Step only, Sprint or Grand Prix race', () => {
    // Same Season as the Sprint crowning above. Before Round 2 (a 37, b 22), only the Grand Prix race (25)
    // follows the Sprint: a is champion after the Sprint if 37 + his points > 22 + b's points + 25,
    // i.e. by 11. By 10 they could tie with a win each, and b's 3rd place would break it.
    const s = season([
      round(1, [sprint('a', at('b', 4)), gp('a', at('b', 3))]),
      round(2, [sprint('a', retired('b')), gp('b', 'a')]),
    ]);
    expect(conditions(s, 0)).toEqual([]);
    expect(conditions(s, 1)).toEqual([{ riderId: 'a', kind: 'margin', rivals: [{ rivalId: 'b', margin: 11 }] }]);
  });

  describe('with Counting windows', () => {
    /** 10-8-7-6-5, best 2 Round scores of 4 count. */
    const best2of4: ScoringRule = {
      ...modern,
      code: 'test-best2',
      points: { 'grand-prix-race': [10, 8, 7, 6, 5] },
      countingWindows: [{ fromRound: 1, toRound: 4, count: 2 }],
    };
    const win = { position: 1, fastestLap: false };

    it('states outcome terms when only winning crowns him ("if he wins")', () => {
      // After Round 2: a 16 (10 + 6), b 16 (8 + 8), a ahead on Countback. Rounds 3 and 4 remain.
      // b keeps two 8s and can win Round 4, so b can reach 18 whatever happens in Round 3 (20 if he wins it).
      // a wins Round 3: 20, and b (2nd at best) reaches 18: champion.
      // a 2nd in Round 3: 18, and b reaches at least 18 with a win and two 2nd places to a's win and 2nd: not.
      // Points margins cannot say this: a 2nd with b scoring nothing is 8 up and not enough, a win over
      // b's 2nd is 2 up and enough.
      const s = season([
        round(1, [gp('a', 'b')]),
        round(2, [gp(at('b', 2), at('a', 4))]),
        round(3, [gp('a', 'b')]),
        round(4, [gp('b', 'a')]),
      ], best2of4);
      expect(conditions(s, 1)).toEqual([{ riderId: 'a', kind: 'outcome', clauses: [{ worst: win, rivals: [] }] }]);
    });

    it('states outcome terms on the rival when his own result does not matter', () => {
      // After Round 2: a 20 (two wins), b 16 (two 2nds). Rounds 3 and 4 remain.
      // If b wins Round 3 he can tie on 20 with two wins and two 2nd places, ahead on Countback of a
      // (two wins, and at best one 2nd). If b does not win Round 3, his best is 10 + 8 = 18.
      const s = season([
        round(1, [gp('a', 'b')]),
        round(2, [gp('a', 'b')]),
        round(3, [gp('a', 'b')]),
        round(4, [gp('b', 'a')]),
      ], best2of4);
      expect(conditions(s, 1)).toEqual([{
        riderId: 'a',
        kind: 'outcome',
        clauses: [
          { worst: win, rivals: [] },
          { worst: { position: null, fastestLap: false }, rivals: [{ rivalId: 'b', atBest: { position: 2, fastestLap: false } }] },
        ],
      }]);
    });
  });
});
