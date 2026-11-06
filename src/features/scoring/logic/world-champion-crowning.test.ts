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
  // "The race victory for Graham, with Pagani only in third place, wrapped up the first world
  // championship for Graham." Round 5 of 6, with only the best three Round scores counting.
  '500cc-1949': {
    rider: 'leslie-graham',
    round: 5,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1949_Ulster_Grand_Prix',
  },
  // Going into the Brazilian finale "Wayne Rainey has to win and Eddie Lawson has to finish outside
  // the top 11 in order for Lawson to lose the championship"; Lawson was 2nd.
  '500cc-1989': {
    rider: 'eddie-lawson',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1989_Brazilian_motorcycle_Grand_Prix',
  },
  // "Sheene rebounded to win the Swedish Grand Prix, clinching the World Championship with three rounds
  // remaining." Round 7 of the 500cc Season (the Swedish TT).
  '500cc-1976': {
    rider: 'barry-sheene',
    round: 7,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1976_Grand_Prix_motorcycle_racing_season',
  },
  // "Francesco Bagnaia successfully defended his Riders' Championship by winning the Grand Prix and with
  // closest title contender Jorge Martín crashing out": the Valencian finale, Round 20 of 20.
  'motogp-2023': {
    rider: 'francesco-bagnaia',
    round: 20,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2023_Valencian_Community_motorcycle_Grand_Prix',
  },
  // Martín went into the Barcelona finale 24 points up; Bagnaia won the Sprint (Martín 3rd, 19 up with
  // 25 left), and Martín's 3rd place in the Grand Prix race, the last Step, decided it.
  'motogp-2024': {
    rider: 'jorge-martin',
    round: 20,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2024_MotoGP_World_Championship',
  },
  // "Marc Márquez of Ducati Lenovo Team finished second in the main race, clinching his seventh MotoGP
  // World Riders' Championship": the Japanese Grand Prix, Round 17 of 22.
  'motogp-2025': {
    rider: 'marc-marquez',
    round: 17,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2025_Japanese_motorcycle_Grand_Prix',
  },
  // "Bagnaia secured his first MotoGP riders' title after finishing in ninth, as Quartararo's fourth-place-finish was eventually not enough": the Valencian finale, Round 20 of 20.
  'motogp-2022': {
    rider: 'francesco-bagnaia',
    round: 20,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2022_Valencian_Community_motorcycle_Grand_Prix',
  },
  // "Ultimately finishing the race in fourth after a last-lap pass by Enea Bastianini, Quartararo was crowned the 2021 MotoGP World Champion": the Emilia Romagna Grand Prix, Round 16 of 18.
  'motogp-2021': {
    rider: 'fabio-quartararo',
    round: 16,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2021_MotoGP_World_Championship',
  },
  // "Joan Mir claimed the premier class title after securing seventh place": the Valencian Community Grand Prix, Round 13 of 14.
  'motogp-2020': {
    rider: 'joan-mir',
    round: 13,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2020_Valencian_Community_motorcycle_Grand_Prix',
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
