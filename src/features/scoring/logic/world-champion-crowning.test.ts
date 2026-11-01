import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getSeason } from '@/features/seasons/queries/get-season';
import { computeReplay } from './compute-replay';

// Real Seasons: the World Champion must be crowned at the Step where the title was historically decided.
// Every Season in data/seasons must have an entry here.
const crowned: Record<string, { rider: string; round: number; session: string; source: string }> = {
  // "Sheene rebounded to win the Swedish Grand Prix, clinching the World Championship with three rounds
  // remaining." Round 7 of the 500cc Season (the Swedish TT).
  '500cc-1976': {
    rider: 'barry-sheene',
    round: 7,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1976_Grand_Prix_motorcycle_racing_season',
  },
  // Martín went into the Barcelona finale 24 points up; Bagnaia won the Sprint (Martín 3rd, 19 up with
  // 25 left), and Martín's 3rd place in the Grand Prix race, the last Step, decided it.
  'motogp-2024': {
    rider: 'jorge-martin',
    round: 20,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2024_MotoGP_World_Championship',
  },
};

const dataDir = path.join(process.cwd(), 'data');

beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-crowning-')), 'real.db');
  buildDatabase(dataDir, dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

const loaded = readdirSync(path.join(dataDir, 'seasons'))
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace('.json', ''));

describe.each(loaded)('World Champion of %s', (name) => {
  it('is crowned at the historically correct Step and stays crowned', () => {
    const expected = crowned[name];
    expect(expected, `no historical crowning Step recorded for ${name}`).toBeDefined();
    const [classCode, year] = name.split('-');
    const steps = computeReplay(getSeason(classCode, Number(year))!);
    const first = steps.findIndex((s) => s.worldChampion != null);
    expect(first).toBeGreaterThanOrEqual(0);
    expect([steps[first].worldChampion, steps[first].roundNumber, steps[first].sessionType]).toEqual([
      expected.rider, expected.round, expected.session,
    ]);
    expect(steps.slice(first).every((s) => s.worldChampion === expected.rider)).toBe(true);
  });
});
