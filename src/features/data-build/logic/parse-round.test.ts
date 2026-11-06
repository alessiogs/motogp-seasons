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

  it('also reads a classification filed under "Race results" > "MotoGP" (2022 Valencia)', () => {
    const renamed = sample.replace('==Classification==', '==Race results==');
    const other = parseRound(1, '2022 Valencian Community motorcycle Grand Prix', 2013, renamed, riderId, 'motogp')!;
    expect((other.sessions[0] as { results: unknown[] }).results).toHaveLength(3);
  });
});

describe('parseRound for a cancelled Grand Prix', () => {
  // The 2018 British report article keeps the infobox and qualifying but has no classification.
  const cancelled = `{{Infobox Grand Prix motorcycle race report
| Grand Prix = British
| Date = 26 August
}}

The '''2018 British motorcycle Grand Prix''' was the scheduled twelfth round of the 2018 MotoGP season. Planned to be held at the [[Silverstone Circuit]] on 26 August 2018, the race was cancelled due to heavy rain.

==Qualifying==
Qualifying was conducted on 25 August 2018.
`;

  it('has no Round to load, so the loader leaves it out for a hand-written Non-championship round', () => {
    expect(parseRound(12, '2018 British motorcycle Grand Prix', 2018, cancelled, riderId, 'motogp')).toBeNull();
  });

  it('still refuses a report that has no classification and was not cancelled', () => {
    const broken = cancelled.replace('the race was cancelled due to heavy rain', 'the race was held');
    expect(() => parseRound(12, '2018 British motorcycle Grand Prix', 2018, broken, riderId, 'motogp')).toThrow(
      /no MotoGP race classification/,
    );
  });
});

describe('parseRound for a MotoGP Round filed under "MotoGP classification"', () => {
  // Trimmed from the 2012 Dutch TT report article, a layout shared by 2010-2012 (and earlier):
  // the classification is a top-level "MotoGP classification" heading with no "Race" parent.
  const dutch = readFileSync(
    path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/2012-dutch-tt.txt'),
    'utf8',
  );

  it('reads the Grand Prix race from that heading and not the Moto2 one', () => {
    const round = parseRound(7, '2012 Dutch TT', 2012, dutch, riderId, 'motogp')!;
    expect(round.sessions.map((s) => (s as { type: string }).type)).toEqual(['grand-prix-race']);
    const results = (round.sessions[0] as { results: { rider: string; position: number }[] }).results;
    expect(results.map((r) => [r.rider, r.position])).toEqual([
      ['casey-stoner', 1],
      ['dani-pedrosa', 2],
      ['andrea-dovizioso', 3],
    ]);
  });
});
