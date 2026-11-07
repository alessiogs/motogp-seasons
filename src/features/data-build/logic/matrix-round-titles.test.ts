import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { matrixRoundTitles } from './matrix-round-titles';

const fixture = (name: string) =>
  readFileSync(path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext', name), 'utf8');

describe('matrixRoundTitles', () => {
  it('lists the report article of each column of the 500cc standings matrix (1983 sample, 12 columns)', () => {
    const titles = matrixRoundTitles(fixture('1983-riders-standings.txt'));
    expect(titles).toHaveLength(12);
    expect(titles[0]).toBe('1983 South African motorcycle Grand Prix');
    expect(titles[11]).toBe('1983 San Marino motorcycle Grand Prix');
  });

  it('reads headings with a <br /> and a flag template (1988 sample, 15 columns)', () => {
    const titles = matrixRoundTitles(fixture('1988-riders-standings.txt'));
    expect(titles).toHaveLength(15);
    expect(titles[3]).toBe('1988 Expo 92 motorcycle Grand Prix');
  });
});
