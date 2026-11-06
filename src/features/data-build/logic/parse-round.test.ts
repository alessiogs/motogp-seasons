import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseRound } from './parse-round';

// Trimmed from the 2013 Qatar report article, a layout shared by 2013-2022: no Sprint, and the
// classification under "Classification" > "MotoGP" with no "Race" heading.
const sample = readFileSync(
  path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/2013-qatar-grand-prix.txt'),
  'utf8',
);
const riderId = (_title: string, name: string) => name.toLowerCase().replaceAll(' ', '-');

describe('parseRound for a MotoGP Round without a Sprint', () => {
  const round = parseRound(1, '2013 Qatar motorcycle Grand Prix', 2013, sample, riderId, 'motogp')!;

  it('has only the Grand Prix race, from the MotoGP classification', () => {
    expect(round.sessions.map((s) => (s as { type: string }).type)).toEqual(['grand-prix-race']);
    const results = (round.sessions[0] as { results: { rider: string; position: number }[] }).results;
    expect(results.map((r) => [r.rider, r.position])).toEqual([
      ['jorge-lorenzo', 1],
      ['valentino-rossi', 2],
      ['marc-márquez', 3],
    ]);
  });

  it('numbers the Session 1 and keeps the Round details', () => {
    expect((round.sessions[0] as { order: number }).order).toBe(1);
    expect(round.date).toBe('2013-04-07');
    expect(round.circuit).toBe('Losail International Circuit');
  });
});
