import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseStandingsMatrix } from './parse-standings-matrix';

const fixture = (name: string) =>
  readFileSync(path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext', name), 'utf8');
const riderId = (_title: string, name: string) => name.toLowerCase().replaceAll(' ', '-');

describe('parseStandingsMatrix for a table with Team and Machine columns', () => {
  // Trimmed from the 1983 season article (layout shared by 1978-1988): Rider, Team, Machine, one cell per Round, Points.
  it('reads the Team cell as Team and the Manufacturer from the Machine cell', () => {
    const matrix = parseStandingsMatrix(fixture('1983-riders-standings.txt'), 12, riderId);
    const first = matrix.resultsForRound(0, 'src');
    expect(first.map((r) => [r.rider, r.position, r.team, r.manufacturer])).toEqual([
      ['freddie-spencer', 1, 'HRC-Honda', 'Honda'],
      ['kenny-roberts', 2, 'Marlboro Agostini-Yamaha', 'Yamaha'],
      ['randy-mamola', 5, 'HB Sinclair-Suzuki', 'Suzuki'],
    ]);
  });
});

describe('parseStandingsMatrix for cells with superscript marks', () => {
  // Trimmed from the 1987 season article (1987 layout): "1'''<sup>F</sup>'''" is a win with the fastest lap,
  // "10{{nowrap|'''<sup>P F</sup>'''}}" a 10th place that also took the pole and the fastest lap.
  const matrix = parseStandingsMatrix(fixture('1987-riders-standings.txt'), 15, riderId);

  it('reads the position under the marks', () => {
    expect(matrix.resultsForRound(1, 'src').map((r) => [r.rider, r.position, r.outcome])).toEqual([['wayne-gardner', 1, 'FIN']]);
    expect(matrix.resultsForRound(2, 'src').map((r) => r.position)).toEqual([10]);
    expect(matrix.resultsForRound(0, 'src').map((r) => r.position)).toEqual([2]);
  });

  it('flags the fastest lap from the F mark', () => {
    expect(matrix.resultsForRound(1, 'src')[0].fastestLap).toBe(true);
    expect(matrix.resultsForRound(0, 'src')[0].fastestLap).toBe(false);
  });
});

describe('parseStandingsMatrix for a table without a Team column', () => {
  // Trimmed from the 1970 season article (layout shared by 1969-1972): Rider, Machine, one cell per Round, Points.
  const matrix = parseStandingsMatrix(fixture('1970-riders-standings.txt'), 11, riderId);

  it('reads the first bike named in the Machine cell as the Manufacturer, and no Team', () => {
    expect(matrix.resultsForRound(0, 'src').map((r) => [r.rider, r.position, r.team, r.manufacturer])).toEqual([
      ['giacomo-agostini', 1, null, 'MV Agusta'],
      ['ginger-molloy', 5, null, 'Bultaco'],
    ]);
  });

  it('flags the fastest lap from italics', () => {
    expect(matrix.resultsForRound(0, 'src')[0].fastestLap).toBe(true);
    expect(matrix.resultsForRound(0, 'src')[1].fastestLap).toBe(false);
  });
});
