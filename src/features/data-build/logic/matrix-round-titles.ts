import { standingsTable } from './standings-table';

/**
 * Report article titles of the Rounds of the 500cc standings matrix, one per column in order: the links in its first heading row.
 * A title can repeat (the East German column of 1969-1971 links the West German article), and later heading rows repeat the columns.
 */
export function matrixRoundTitles(seasonText: string): string[] {
  const table = standingsTable(seasonText);
  if (!table) return [];
  const link = /^!\s*\[\[([^\]|]+)\|[A-Za-z]{2,4}\]\]/gm;
  const start = table.text.search(/^!\s*\[\[[^\]|]+\|[A-Za-z]{2,4}\]\]/m);
  if (start === -1) return [];
  const headingRow = table.text.slice(start).split(/^\|-.*$/m)[0];
  return [...headingRow.matchAll(link)].map((m) => m[1]);
}
