/** Titles of the Grand Prix report articles, in Round order, from the season article's results table. */
export function extractReportTitles(seasonText: string): string[] {
  return [...seasonText.matchAll(/\[\[([^\]|]+)\|Report\]\]/g)].map((m) => m[1]);
}
