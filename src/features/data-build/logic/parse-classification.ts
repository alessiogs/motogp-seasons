import { cellText } from './cell-text';
import { stripMarkup } from './strip-markup';
import { toOutcome } from './to-outcome';
import type { ResultOut } from '../types/result-out';

export function parseClassification(
  tableText: string,
  source: string,
  riderId: (articleTitle: string, displayName: string) => string,
): ResultOut[] {
  const fastestLapTitle = tableText.match(/Fastest lap\]\]:[^\n]*?\[\[([^\]|]+)/)?.[1] ?? null;
  const results: ResultOut[] = [];
  const rows = tableText.split(/^\|-.*$/m);
  const columns = columnsOf(rows);
  for (const row of rows) {
    const cells = row
      .split('\n')
      .filter((l) => /^[!|]/.test(l) && !/^\|[}+]/.test(l) && !/^[!|]\s*colspan/.test(l))
      .map(cellText);
    if (cells.length < 5 || !/flagicon/i.test(row)) continue;
    const pos = cells[columns.pos];
    const bike = columns.bike === -1 ? '' : cells[columns.bike];
    const riderCell = cells[columns.rider];
    const team = columns.team === -1 ? '' : cells[columns.team];
    const constructor = columns.manufacturer === -1 ? '' : cells[columns.manufacturer];
    if (riderCell === undefined) continue;
    const link = riderCell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    // Some articles (2001 wildcards) give a Rider as plain text next to the flag, with no article to link.
    const plainName = stripMarkup(riderCell.replace(/\{\{flagicon\|[^}]*\}\}/i, '')).trim();
    if (!link && !plainName) continue;
    const articleTitle = link ? link[1] : plainName;
    const name = (link ? (link[2] ?? link[1]) : plainName).replace(/\s*\(.*\)$/, '').trim();
    const id = riderId(articleTitle, name);
    if (results.some((r) => r.rider === id)) continue; // some articles list a rider twice
    const classified = /^\d+$/.test(pos);
    results.push({
      rider: id,
      position: classified ? Number(pos) : null,
      outcome: classified ? 'FIN' : toOutcome(pos),
      fastestLap: fastestLapTitle === articleTitle,
      pointsOverride: null,
      team: stripMarkup(team) || null,
      manufacturer: stripMarkup(constructor) || null,
      bikeNumber: /^\d+$/.test(bike) ? Number(bike) : null,
      nationality: riderCell.match(/flagicon\|([A-Za-z]+)/i)?.[1] ?? null,
      source,
    });
  }
  return results;
}

/**
 * Column positions from the heading row. Up to 2012 the layout varies by Season (the bike number and the Team
 * column come and go), so columns are found by name; the fixed layout is the fallback when there are no headings.
 */
function columnsOf(rows: string[]) {
  // The heading row follows the table's opening line, with or without a '|-' between them.
  const headings = (rows.find((r) => /^!\s*Rider/im.test(r)) ?? '').split('\n').filter((l) => l.startsWith('!')).map(cellText);
  const find = (re: RegExp) => headings.findIndex((h) => re.test(h));
  const rider = find(/^rider/i);
  if (rider === -1) return { pos: 0, bike: 1, rider: 2, team: 3, manufacturer: 4 };
  return { pos: 0, bike: find(/^(no|#)\.?$/i), rider, team: find(/^team/i), manufacturer: find(/^(manufacturer|constructor|bike)/i) };
}
