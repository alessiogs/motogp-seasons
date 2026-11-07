import { cellText } from './cell-text';
import { extractTables } from './extract-tables';

export function parseOfficialTable(
  seasonText: string,
  riderId: (articleTitle: string, displayName: string) => string,
  /** The heading of the standings section; several when articles of one class disagree on it. */
  heading: string | string[],
) {
  const headings = Array.isArray(heading) ? heading : [heading];
  const table = extractTables(seasonText).find((t) => headings.some((h) => t.path.includes(h)) && /Pts|Points/.test(t.text) && /Rider/.test(t.text));
  if (!table) throw new Error(`${headings.join(' / ')} table not found`);
  const standings: { position: number; rider: string; points: number }[] = [];
  for (const row of table.text.split(/^\|-.*$/m)) {
    const lines = row.split('\n');
    const headers = lines.filter((l) => l.startsWith('!')).map((l) => cellText(l));
    // The flag is a template (2013 on) or an image (up to 2012); the Rider's article is the first link that is not an image.
    const riderLine = lines.find((l) => /flagicon|\[\[File:Flag/i.test(l) && /\[\[(?!File:)/.test(l));
    const link = riderLine?.match(/\[\[(?!File:)([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (!link || headers.length < 2 || !/^\d+$/.test(headers[0])) continue;
    const points = Number(headers[headers.length - 1]);
    if (Number.isNaN(points)) continue;
    standings.push({
      position: Number(headers[0]),
      rider: riderId(link[1], (link[2] ?? link[1]).replace(/\s*\(.*\)$/, '').trim()),
      points,
    });
  }
  return standings;
}
