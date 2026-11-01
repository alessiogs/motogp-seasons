import { cellText } from './cell-text';
import { extractTables } from './extract-tables';

export function parseOfficialTable(
  seasonText: string,
  riderId: (articleTitle: string, displayName: string) => string,
  heading: string,
) {
  const table = extractTables(seasonText).find((t) => t.path.includes(heading) && /Pts|Points/.test(t.text) && /Rider/.test(t.text));
  if (!table) throw new Error(`${heading} table not found`);
  const standings: { position: number; rider: string; points: number }[] = [];
  for (const row of table.text.split(/^\|-.*$/m)) {
    const lines = row.split('\n');
    const headers = lines.filter((l) => l.startsWith('!')).map((l) => cellText(l));
    const riderLine = lines.find((l) => /flagicon/i.test(l) && /\[\[/.test(l));
    const link = riderLine?.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
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
