import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { getSeason } from '@/features/seasons/queries/get-season';
import { getPreviousSeason } from '@/features/seasons/queries/get-previous-season';
import { defendingChampionOf } from '@/features/seasons/logic/defending-champion-of';
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
  // "Marc Márquez won the MotoGP race, ensuring his sixth world title in the class": the Thailand Grand Prix, Round 15 of 19.
  'motogp-2019': {
    rider: 'marc-marquez',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2019_Thailand_motorcycle_Grand_Prix',
  },
  // "Marc Márquez clinched his third consecutive MotoGP title after Andrea Dovizioso crashed during the penultimate lap": the Japanese Grand Prix, the sixteenth round counting the cancelled British one, Round 16 of 19.
  'motogp-2018': {
    rider: 'marc-marquez',
    round: 16,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2018_Japanese_motorcycle_Grand_Prix',
  },
  // "Marc Márquez clinched his fourth premier class title and sixth overall with a third place finish after rival Andrea Dovizioso crashed out": the Valencian finale, Round 18 of 18.
  'motogp-2017': {
    rider: 'marc-marquez',
    round: 18,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2017_Valencian_Community_motorcycle_Grand_Prix',
  },
  // "Marc Márquez, doing a burnout and celebrating his third MotoGP world championship title after winning the race" (photo caption in the article): the Japanese Grand Prix, Round 15 of 18.
  'motogp-2016': {
    rider: 'marc-marquez',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2016_Japanese_motorcycle_Grand_Prix',
  },
  // "Lorenzo was subject to heavy pressure by the Honda riders during the final lap, but held on to claim his third MotoGP and fifth overall title": the Valencian finale, Round 18 of 18.
  'motogp-2015': {
    rider: 'jorge-lorenzo',
    round: 18,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2015_Valencian_Community_motorcycle_Grand_Prix',
  },
  // "a second-place finish for Marc Márquez was good enough for his second consecutive premier class world championship": the Japanese Grand Prix, Round 15 of 18.
  'motogp-2014': {
    rider: 'marc-marquez',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2014_Japanese_motorcycle_Grand_Prix',
  },
  // "Marc Márquez became MotoGP world champion in his rookie season": the Valencian finale, Round 18 of 18.
  'motogp-2013': {
    rider: 'marc-marquez',
    round: 18,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2013_Valencian_Community_motorcycle_Grand_Prix',
  },
  // "Lorenzo does a big wheelie as he crosses the finish line to come home in second place, making him the 2012 MotoGP world champion": the Australian Grand Prix, Round 17 of 18.
  'motogp-2012': {
    rider: 'jorge-lorenzo',
    round: 17,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2012_Australian_motorcycle_Grand_Prix',
  },
  // "Australian rider Casey Stoner clinched the 2011 MotoGP World Championship with his fifth consecutive victory at his home Grand Prix on his 26th birthday": the Australian Grand Prix, Round 16 of 18, the Malaysian Round 17 being cancelled.
  'motogp-2011': {
    rider: 'casey-stoner',
    round: 16,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2011_Australian_motorcycle_Grand_Prix',
  },
  // "Jorge Lorenzo was crowned MotoGP World Champion for the first time, after he finished third in the Malaysian Grand Prix on 10 October": the Malaysian Grand Prix, Round 15 of 18.
  'motogp-2010': {
    rider: 'jorge-lorenzo',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2010_Grand_Prix_motorcycle_racing_season',
  },
  // "Valentino Rossi finished third, which clinched the 2009 MotoGP championship for him": the Malaysian Grand Prix, Round 16 of 17.
  'motogp-2009': {
    rider: 'valentino-rossi',
    round: 16,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2009_Malaysian_motorcycle_Grand_Prix',
  },
  // "Rossi clinched his sixth premier class title with three races to go, by winning the race ahead of Stoner": the Japanese Grand Prix, Round 15 of 18.
  'motogp-2008': {
    rider: 'valentino-rossi',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2008_Grand_Prix_motorcycle_racing_season',
  },
  // "teammate Stoner secured his and Ducati's first MotoGP title with a sixth place": the Japanese Grand Prix, Round 15 of 18.
  'motogp-2007': {
    rider: 'casey-stoner',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2007_Japanese_motorcycle_Grand_Prix',
  },
  // "The MotoGP riders' championship was decided at this race, as Nicky Hayden's third place ensured he completed the season with more points than his rival": the Valencian finale, Round 17 of 17.
  'motogp-2006': {
    rider: 'nicky-hayden',
    round: 17,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2006_Valencian_Community_motorcycle_Grand_Prix',
  },
  // Crash.net's race report headline, "Capirossi wins, Rossi crowned 2005 champion" (Rossi was second; no Wikipedia article states the clinch): the Malaysian Grand Prix, Round 13 of 17.
  'motogp-2005': {
    rider: 'valentino-rossi',
    round: 13,
    session: 'grand-prix-race',
    source: 'https://www.crash.net/motogp/race-report/76531/1/capirossi-wins-rossi-crowned-2005-champion',
  },
  // "Rossi's subsequent crowning as world champion - clinching his sixth overall world title, fourth premier-class title and third back-to-back MotoGP title": the Australian Grand Prix, the penultimate Round, 15 of 16.
  'motogp-2004': {
    rider: 'valentino-rossi',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2004_Australian_motorcycle_Grand_Prix',
  },
  // Road Racing World's headline, "Rossi Wins MotoGP Race And World Championship At Sepang" (the Wikipedia articles only call him "newly-crowned" at the next Round, Australia): the Malaysian Grand Prix, Round 14 of 16.
  'motogp-2003': {
    rider: 'valentino-rossi',
    round: 14,
    session: 'grand-prix-race',
    source: 'https://www.roadracingworld.com/?p=60055',
  },
  // Motorcycle News headline, "Rossi takes the title with a win in Rio" (the Wikipedia articles do not state the clinch): the Rio de Janeiro Grand Prix, Round 12 of 16.
  'motogp-2002': {
    rider: 'valentino-rossi',
    round: 12,
    session: 'grand-prix-race',
    source: 'https://motorcyclenews.com/sport/motogp/2002/september/rossi-takes-the-title-with-a-win-in-rio',
  },
  // Rossi "sew-up the championship with two rounds to go" (the article's "that race" is muddled: the title was not decided in the Suzuka opener): the Australian Grand Prix, Round 14 of 16.
  '500cc-2001': {
    rider: 'valentino-rossi',
    round: 14,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2001_Grand_Prix_motorcycle_racing_season',
  },
  // "scoring points in every race but Hungary after he had already clinched the championship": Rainey had it by the Czechoslovak Grand Prix, Round 13 of 15 (after Round 13 he led Schwantz by 67 with 40 left).
  '500cc-1990': {
    rider: 'wayne-rainey',
    round: 13,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1990_Grand_Prix_motorcycle_racing_season',
  },
  // "at ten laps to go, Rainey just needs to stay in 3rd place to win the championship": the Le Mans Grand Prix, Round 14 of 15.
  '500cc-1991': {
    rider: 'wayne-rainey',
    round: 14,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1991_Vitesse_du_Mans_motorcycle_Grand_Prix',
  },
  // "Rainey's 3rd place is enough to win the championship by 4 points": the South African finale, Round 13 of 13.
  '500cc-1992': {
    rider: 'wayne-rainey',
    round: 13,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1992_South_African_motorcycle_Grand_Prix',
  },
  // Wikipedia does not say where Schwantz clinched. Rainey's accident at Misano (Round 12) ended his season; the title was decided at the finale, the FIM Grand Prix at Jarama, Round 14 of 14 (the season article: "Schwantz won the 500cc 1993 world championship").
  '500cc-1993': {
    rider: 'kevin-schwantz',
    round: 14,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1993_Grand_Prix_motorcycle_racing_season',
  },
  // "Mick Doohan would secure the first of his five consecutive world championships in the 500cc class by winning the race, as with three races to go, he could no longer be caught": the Czech Republic Grand Prix, Round 11 of 14.
  '500cc-1994': {
    rider: 'mick-doohan',
    round: 11,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1994_Czech_Republic_motorcycle_Grand_Prix',
  },
  // Photo caption "Mick Doohan, celebrating his second 500cc title after winning the race": the Argentine Grand Prix, Round 12 of 13.
  '500cc-1995': {
    rider: 'mick-doohan',
    round: 12,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1995_Argentine_motorcycle_Grand_Prix',
  },
  // Wikipedia does not say where Doohan clinched. The Catalan Grand Prix, Round 13 of 15, is the first Round after which his lead (61 over Crivillé) exceeds the 50 points left; the 1996 season article names him champion ("continued his domination of the 500 class").
  '500cc-1996': {
    rider: 'mick-doohan',
    round: 13,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1996_Grand_Prix_motorcycle_racing_season',
  },
  // "Doohan's victory now means he has an unassailable lead over his championship rivals, making him the 1997 world champion": the British Grand Prix, Round 11 of 15.
  '500cc-1997': {
    rider: 'mick-doohan',
    round: 11,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1997_British_motorcycle_Grand_Prix',
  },
  // Photo caption "Mick Doohan, clinching his fifth and final 500cc title after winning the race": the Australian Grand Prix, Round 13 of 14.
  '500cc-1998': {
    rider: 'mick-doohan',
    round: 13,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1998_Australian_motorcycle_Grand_Prix',
  },
  // Wikipedia does not say where Crivillé clinched (its Rio article covers Rossi's 250cc title). The Rio de Janeiro Grand Prix, Round 15 of 16, is the first Round after which his lead (45 over Okada) exceeds the 25 points left; the 1999 season article: "Crivillé stepped forward and claimed Spain's first-ever 500cc world championship".
  '500cc-1999': {
    rider: 'alex-criville',
    round: 15,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/1999_Grand_Prix_motorcycle_racing_season',
  },
  // "Kenny Roberts Jr sealed the world title at this race by finishing in 6th place": the Rio de Janeiro Grand Prix, Round 14 of 16.
  '500cc-2000': {
    rider: 'kenny-roberts-jr',
    round: 14,
    session: 'grand-prix-race',
    source: 'https://en.wikipedia.org/wiki/2000_Rio_de_Janeiro_motorcycle_Grand_Prix',
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

describe('Defending Champion of MotoGP 2002', () => {
  it('is the 500cc 2001 World Champion, Rossi, the Category continuing across the class change', () => {
    expect(defendingChampionOf(getPreviousSeason('motogp', 2002))).toEqual({ riderId: 'valentino-rossi', name: 'Valentino Rossi' });
  });
});
