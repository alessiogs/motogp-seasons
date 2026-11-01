import { describe, expect, it } from 'vitest';
import type { Result } from '@/features/seasons/types/result';
import type { Session } from '@/features/seasons/types/session';
import { classificationOf } from './classification-of';

function result(riderId: string, position: number | null, outcome: Result['outcome']): Result {
  return { riderId, position, outcome, team: null, manufacturer: null, bikeNumber: null, nationality: null, source: 'test' };
}

function session(results: Result[]): Session {
  return { type: 'grand-prix-race', order: 1, date: null, pointsMultiplier: 1, results };
}

describe('classificationOf', () => {
  it('lists every Outcome: finishers by position, then Not classified, Did not finish, Did not start, Disqualified', () => {
    const rows = classificationOf(
      session([
        result('dnf-a', null, 'DNF'),
        result('dsq', null, 'DSQ'),
        result('second', 2, 'FIN'),
        result('dns', null, 'DNS'),
        result('first', 1, 'FIN'),
        result('nc', null, 'NC'),
        result('dnf-b', null, 'DNF'),
      ]),
    );
    expect(rows.map((r) => [r.riderId, r.positionLabel, r.outcomeLabel])).toEqual([
      ['first', '1', null],
      ['second', '2', null],
      ['nc', '–', 'Not classified'],
      ['dnf-a', '–', 'Did not finish'],
      ['dnf-b', '–', 'Did not finish'],
      ['dns', '–', 'Did not start'],
      ['dsq', '–', 'Disqualified'],
    ]);
  });
});
