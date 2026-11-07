import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCalendar } from './parse-calendar';

// Trimmed from the 1959 season article: Rounds 6 to 8. The Swedish 500cc race "did not count towards the World Championship" (†),
// and the Nations Grand Prix carries a second footnote mark (††) after its name, as do circuits in other years (1954 Snaefell Mountain).
const sample = readFileSync(path.join(process.cwd(), 'src/features/data-build/fixtures/wikitext/1959-calendar.txt'), 'utf8');

describe('parseCalendar', () => {
  it('keeps the Round numbering of the calendar, a Round that did not count included', () => {
    const rounds = parseCalendar(sample, 1959);
    expect(rounds[5]).toMatchObject({ name: 'Swedish Grand Prix', circuit: 'Råbelövsbanan', date: '1959-07-26' });
    expect(rounds[6]).toMatchObject({ name: 'Ulster Grand Prix', date: '1959-08-08' });
  });

  it('drops the footnote marks after a Grand Prix name', () => {
    expect(parseCalendar(sample, 1959)[7].name).toBe('Nations Grand Prix');
  });
});
