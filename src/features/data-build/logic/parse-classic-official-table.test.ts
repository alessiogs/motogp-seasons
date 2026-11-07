import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseClassicOfficialTable } from './parse-classic-official-table';

// Trimmed from the 1983 season article, a layout shared by 1978 and 1982-1985: the points column
// is headed "Points", not "Pts", and the Rider cell holds a flag template and a link.
const sample = readFileSync(
  path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/1983-riders-standings.txt'),
  'utf8',
);
const riderId = (_title: string, name: string) => name.toLowerCase().replaceAll(' ', '-');

describe("parseClassicOfficialTable for a table whose points column is headed 'Points'", () => {
  it('reads position, Rider and points', () => {
    expect(parseClassicOfficialTable(sample, riderId)).toEqual([
      { position: 1, rider: 'freddie-spencer', points: 144 },
      { position: 2, rider: 'kenny-roberts', points: 142 },
      { position: 3, rider: 'randy-mamola', points: 89 },
    ]);
  });
});

describe('parseClassicOfficialTable for a table with inline "||" rows', () => {
  // Trimmed from the 1988 season article: the loader falls back to this reader when parseOfficialTable finds no row.
  const sample1988 = readFileSync(
    path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/1988-riders-standings.txt'),
    'utf8',
  );

  it('reads position, Rider and points', () => {
    expect(parseClassicOfficialTable(sample1988, riderId)).toEqual([
      { position: 1, rider: 'eddie-lawson', points: 252 },
      { position: 2, rider: 'wayne-gardner', points: 229 },
      { position: 3, rider: 'wayne-rainey', points: 189 },
    ]);
  });
});

describe('parseClassicOfficialTable for Riders level on points', () => {
  // Trimmed from the 1977 season article (layout shared by 1977-1979): further down the table a Rider has no position cell.
  const sample1977 = readFileSync(
    path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/1977-riders-standings.txt'),
    'utf8',
  );

  it('keeps the rows without a position cell, ranked with the Rider above', () => {
    expect(parseClassicOfficialTable(sample1977, riderId).map((r) => [r.rider, r.points])).toEqual([
      ['barry-sheene', 107],
      ['franz-heller', 6],
      ['karl-auer', 1],
      ['kevin-wrettom', 1],
    ]);
  });
});
