import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseOfficialTable } from './parse-official-table';

// Trimmed from the 2022 season article: Bagnaia's row and Bradl's, whose position and points cells
// carry an unquoted attribute ("!rowspan=2| 26") because he rode for two Teams.
const sample = readFileSync(
  path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/2022-riders-standings.txt'),
  'utf8',
);
const riderId = (_title: string, name: string) => name.toLowerCase().replaceAll(' ', '-');

describe("parseOfficialTable for a Riders' standings table", () => {
  it('reads a row whose position and points cells have an unquoted rowspan', () => {
    expect(parseOfficialTable(sample, riderId, "Riders' standings")).toEqual([
      { position: 1, rider: 'francesco-bagnaia', points: 265 },
      { position: 26, rider: 'stefan-bradl', points: 2 },
    ]);
  });
});

describe("parseOfficialTable for a Riders' standings table with image flags", () => {
  // Trimmed from the 2011 season article, a layout shared by 2002-2011: the Rider cell holds
  // "[[File:Flag of ….svg|…]] [[Casey Stoner]]" instead of a flag template.
  const sample2011 = readFileSync(
    path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/2011-riders-standings.txt'),
    'utf8',
  );

  it('reads the Rider from the article link after the flag image', () => {
    expect(parseOfficialTable(sample2011, riderId, "Riders' standings")).toEqual([
      { position: 1, rider: 'casey-stoner', points: 350 },
      { position: 2, rider: 'jorge-lorenzo', points: 260 },
    ]);
  });
});
