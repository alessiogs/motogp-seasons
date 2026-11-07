import { cellText } from './cell-text';
import { firstPerRider } from './first-per-rider';
import { parseRiderCell } from './parse-rider-cell';
import { standingsTable } from './standings-table';
import { stripMarkup } from './strip-markup';
import { tableRows } from './table-rows';
import type { RiderIdFn } from '../types/rider-id-fn';

/** The 500cc final riders' standings table of the season article (positions and points). */
export function parseClassicOfficialTable(seasonText: string, riderId: RiderIdFn) {
  const table = standingsTable(seasonText);
  if (!table) throw new Error("500cc riders' standings table not found");
  const standings: { position: number; rider: string; points: number }[] = [];
  for (const row of tableRows(table.text)) {
    const riderCell = row.find((c) => /flagicon/i.test(c) && !/<br/i.test(c));
    const who = riderCell ? parseRiderCell(riderCell) : null;
    // Riders level on points further down the table have no position cell, or "=" (1969-1971) or "-" (1960) in it: they share the one above.
    const cell = row[0] && cellText(`|${row[0]}`);
    const shares = (cell === '=' || cell === '-' || riderCell === row[0]) && standings.length > 0;
    const position = /^\d+$/.test(cell) ? cell : shares ? String(standings[standings.length - 1].position) : cell;
    const points = stripMarkup(cellText(`|${row[row.length - 1]}`)).replace(/'/g, '').match(/^\d+(?:\.\d+)?/)?.[0];
    if (!who || !position || !/^\d+$/.test(position) || points == null) continue;
    standings.push({
      position: Number(position),
      rider: riderId(who.title, who.name),
      points: Number(points),
    });
  }
  return firstPerRider(standings);
}
