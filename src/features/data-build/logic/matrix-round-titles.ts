import { standingsTable } from './standings-table';

/** Report article titles of the Rounds of the 500cc standings matrix, in column order: the links in its column headings. */
export function matrixRoundTitles(seasonText: string): string[] {
  const table = standingsTable(seasonText);
  if (!table) return [];
  const titles = [...table.text.matchAll(/^!\s*\[\[([^\]|]+)\|[A-Za-z]{2,4}\]\]/gm)].map((m) => m[1]);
  return [...new Set(titles)];
}
