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
  for (const row of tableText.split(/^\|-.*$/m)) {
    const cells = row
      .split('\n')
      .filter((l) => /^[!|]/.test(l) && !/^\|[}+]/.test(l) && !/^[!|]\s*colspan/.test(l))
      .map(cellText);
    if (cells.length < 5 || !/\[\[/.test(row.split('\n').find((l) => /flagicon/i.test(l)) ?? '')) continue;
    const [pos, bike, riderCell, team, constructor] = cells;
    const link = riderCell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (!link) continue;
    const articleTitle = link[1];
    const name = (link[2] ?? link[1]).replace(/\s*\(.*\)$/, '').trim();
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
