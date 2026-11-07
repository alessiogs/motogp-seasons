import { cellText } from './cell-text';
import { firstPerRider } from './first-per-rider';
import { manufacturerOfMachine } from './manufacturer-of-machine';
import { parseRiderCell } from './parse-rider-cell';
import { standingsTable } from './standings-table';
import { stripMarkup } from './strip-markup';
import { tableRows } from './table-rows';
import { toOutcome } from './to-outcome';
import type { ResultOut } from '../types/result-out';
import type { RiderIdFn } from '../types/rider-id-fn';

/** The 500cc final-standings matrix of the season article: one cell per Round (position, "Ret", blank; italics = fastest lap). */
export function parseStandingsMatrix(seasonText: string, roundCount: number, riderId: RiderIdFn) {
  const entries: { riderId: string; nationality: string | null; team: string | null; machine: string | null; cells: string[] }[] = [];
  const table = standingsTable(seasonText);
  const rows = table ? tableRows(table.text) : [];
  // Tables headed "Team" and "Machine" (1978-1988) have both; older ones (1949, 1989) have the machine cell first.
  const heading = rows.map((r) => r.map(plain)).find((r) => r.includes('Rider'));
  const teamOffset = heading && heading.includes('Team') ? heading.indexOf('Team') - heading.indexOf('Rider') : null;
  const machineOffset = heading && heading.includes('Machine') ? heading.indexOf('Machine') - heading.indexOf('Rider') : null;
  for (const row of rows) {
    const riderIdx = row.findIndex((c) => /flagicon/i.test(c) && !/<br/i.test(c)); // not a column header
    const who = riderIdx === -1 ? null : parseRiderCell(row[riderIdx]);
    if (!who) continue;
    const rest = row.slice(riderIdx + 1);
    entries.push({
      riderId: riderId(who.title, who.name),
      nationality: row[riderIdx].match(/flagicon\|([A-Za-z ]+)/i)?.[1] ?? null,
      team: teamOffset == null ? null : plain(row[riderIdx + teamOffset] ?? '') || null,
      machine: plain(row[riderIdx + (machineOffset ?? 1)] ?? '') || null,
      // Machine (and Team) cells come first, then one cell per Round, then the points.
      cells: rest.slice(rest.length - 1 - roundCount, rest.length - 1),
    });
  }
  return {
    resultsForRound(index: number, source: string): ResultOut[] {
      const out: ResultOut[] = [];
      for (const e of firstPerRider(entries)) {
        const raw = e.cells[index] ?? '';
        // Cells of the 1987 table carry superscript marks: "1'''<sup>P F</sup>'''" is a win from pole with the fastest lap.
        const mark = raw.match(/<sup>([^<]*)<\/sup>/)?.[1] ?? '';
        const value = stripMarkup(cellText(`|${raw.replace(/<sup>[^<]*<\/sup>/g, '').replace(/\{\{nowrap\|([^}]*)\}\}/g, '$1')}`)).replace(/'/g, '').trim();
        if (!value) continue;
        const classified = /^\d+$/.test(value);
        out.push({
          rider: e.riderId,
          position: classified ? Number(value) : null,
          outcome: classified ? 'FIN' : toOutcome(value),
          fastestLap: /\bF\b/.test(mark) || /(?<!')''(?!')/.test(raw),
          pointsOverride: null,
          team: e.team,
          manufacturer: teamOffset == null ? e.machine : manufacturerOfMachine(e.machine),
          bikeNumber: null,
          nationality: e.nationality,
          source,
        });
      }
      return out.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    },
  };
}

/** A cell's text without attributes and markup. */
function plain(cell: string): string {
  return stripMarkup(cellText(`|${cell}`));
}
