import { cellText } from './cell-text';
import { firstPerRider } from './first-per-rider';
import { parseRiderCell } from './parse-rider-cell';
import { standingsTable } from './standings-table';
import { stripMarkup } from './strip-markup';
import { tableRows } from './table-rows';
import { toOutcome } from './to-outcome';
import type { ResultOut } from '../types/result-out';
import type { RiderIdFn } from '../types/rider-id-fn';

/** The 500cc final-standings matrix of the season article: one cell per Round (position, "Ret", blank; italics = fastest lap). */
export function parseStandingsMatrix(seasonText: string, roundCount: number, riderId: RiderIdFn) {
  const entries: { riderId: string; nationality: string | null; machine: string | null; cells: string[] }[] = [];
  const table = standingsTable(seasonText);
  for (const row of table ? tableRows(table.text) : []) {
    const riderIdx = row.findIndex((c) => /flagicon/i.test(c) && !/<br/i.test(c)); // not a column header
    const who = riderIdx === -1 ? null : parseRiderCell(row[riderIdx]);
    if (!who) continue;
    const rest = row.slice(riderIdx + 1);
    entries.push({
      riderId: riderId(who.title, who.name),
      nationality: row[riderIdx].match(/flagicon\|([A-Za-z ]+)/i)?.[1] ?? null,
      machine: stripMarkup(rest[0] ?? '') || null,
      // Machine (and Team) cells come first, then one cell per Round, then the points.
      cells: rest.slice(rest.length - 1 - roundCount, rest.length - 1),
    });
  }
  return {
    resultsForRound(index: number, source: string): ResultOut[] {
      const out: ResultOut[] = [];
      for (const e of firstPerRider(entries)) {
        const raw = e.cells[index] ?? '';
        const value = stripMarkup(cellText(`|${raw}`)).replace(/'/g, '').trim();
        if (!value) continue;
        const classified = /^\d+$/.test(value);
        out.push({
          rider: e.riderId,
          position: classified ? Number(value) : null,
          outcome: classified ? 'FIN' : toOutcome(value),
          fastestLap: /''/.test(raw),
          pointsOverride: null,
          team: null,
          manufacturer: e.machine,
          bikeNumber: null,
          nationality: e.nationality,
          source,
        });
      }
      return out.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    },
  };
}
