import { cellText } from './cell-text';
import { extractTables } from './extract-tables';
import { parseRiderCell } from './parse-rider-cell';
import { stripMarkup } from './strip-markup';
import { toOutcome } from './to-outcome';
import type { ResultOut } from '../types/result-out';
import type { RiderIdFn } from '../types/rider-id-fn';

/** A report article's "500cc classification" table, read by its header names. Empty if it has none. */
export function parseClassicClassification(text: string, source: string, riderId: RiderIdFn): ResultOut[] {
  const table = extractTables(text).find(
    (t) => t.path.some((p) => /^500(&nbsp;|\s)*cc/i.test(p) && /classification/i.test(p)) && /Rider/.test(t.text),
  );
  if (!table) return [];
  const allRows = table.text.split(/^\|-.*$/m);
  const headerIdx = allRows.findIndex((r) => /^!.*Rider/im.test(r));
  const rows = allRows.slice(headerIdx === -1 ? 0 : headerIdx);
  const headers = rows[0].split('\n').filter((l) => l.startsWith('!')).map(cellText);
  const col = (re: RegExp) => headers.findIndex((h) => re.test(h));
  const [posCol, riderCol, teamCol, makeCol, numCol] = [/^pos/i, /^rider/i, /^team/i, /^(manufacturer|machine|bike)/i, /^(no|num)/i].map(col);
  if (posCol === -1 || riderCol === -1) return [];
  const results: ResultOut[] = [];
  for (const row of rows.slice(1)) {
    const cells = row.split('\n').filter((l) => /^[!|]/.test(l) && !/^\|[}+]/.test(l)).map(cellText);
    const who = cells[riderCol] && /flagicon/i.test(cells[riderCol]) ? parseRiderCell(cells[riderCol]) : null;
    if (!who) continue;
    const pos = cells[posCol];
    const classified = /^\d+$/.test(pos);
    results.push({
      rider: riderId(who.title, who.name),
      position: classified ? Number(pos) : null,
      outcome: classified ? 'FIN' : toOutcome(pos),
      fastestLap: false,
      pointsOverride: null,
      team: teamCol === -1 ? null : stripMarkup(cells[teamCol] ?? '') || null,
      manufacturer: makeCol === -1 ? null : stripMarkup(cells[makeCol] ?? '') || null,
      bikeNumber: numCol !== -1 && /^\d+$/.test(cells[numCol] ?? '') ? Number(cells[numCol]) : null,
      nationality: cells[riderCol].match(/flagicon\|([A-Za-z ]+)/i)?.[1] ?? null,
      source,
    });
  }
  return results;
}
