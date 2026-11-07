import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseClassicClassification } from './parse-classic-classification';

// Trimmed from the 1983 French Grand Prix article, a layout shared by the 1979-1987 report articles: the heading is
// "500 cc" under "Classification", and the Manufacturer column holds the machine model.
const sample = readFileSync(
  path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/1983-french-grand-prix.txt'),
  'utf8',
);
const riderId = (_title: string, name: string) => name.toLowerCase().replaceAll(' ', '-');

describe('parseClassicClassification for a "500 cc" heading under "Classification"', () => {
  it('reads the Rider, Team and Manufacturer of each row, a machine model giving its brand', () => {
    expect(parseClassicClassification(sample, 'src', riderId).map((r) => [r.rider, r.position, r.team, r.manufacturer])).toEqual([
      ['freddie-spencer', 1, 'HRC-Honda', 'Honda'],
      ['marco-lucchinelli', 2, 'HRC-Honda', 'Honda'],
      ['ron-haslam', 3, 'HRC-Honda', 'Honda'],
    ]);
  });
});
