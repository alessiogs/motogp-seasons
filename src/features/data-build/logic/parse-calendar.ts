import { cellText } from './cell-text';
import { extractTables } from './extract-tables';
import { stripMarkup } from './strip-markup';
import { toIsoDate } from './to-iso-date';

/** Date, Grand Prix name, circuit and country of every Round from the season article's calendar table. */
export function parseCalendar(seasonText: string, year: number) {
  const table = extractTables(seasonText).find((t) => /calendar/i.test(t.path.join(' ')) && /Circuit/.test(t.text));
  if (!table) return [];
  const rounds: { name: string; circuit: string | null; country: string | null; date: string | null }[] = [];
  for (const row of table.text.split(/^\|-.*$/m)) {
    const lines = row.split('\n').filter((l) => /^[!|]/.test(l));
    const first = lines[0] && cellText(lines[0]);
    if (!first || !/^\d+$/.test(first)) continue;
    const [, date, grandPrix, circuit] = lines.map(cellText);
    rounds[Number(first) - 1] = {
      name: withoutFootnoteMarks(stripMarkup(grandPrix.replace(/\{\{flagicon[^}]*\}\}/gi, ''))),
      circuit: withoutFootnoteMarks(stripMarkup(circuit)) || null,
      country: grandPrix.match(/flagicon\|([^|}]+)/i)?.[1] ?? null,
      date: toIsoDate(date, year),
    };
  }
  return rounds;
}

/** "Nations Grand Prix††": the calendar's footnote marks belong to the note below the table, not to the name. */
function withoutFootnoteMarks(text: string): string {
  return text.replace(/\s*[†‡*]+\s*$/, '');
}
