// Loads a Season from Wikipedia into data/ for review (ADR-0007). motogp.com is never fetched.
//
//   npm run data:load-wikipedia -- motogp 2024
//
// Writes data/seasons/<class>-<year>.json, adds new Riders to data/riders.json and writes the
// official final table seen on Wikipedia to data/official-tables/<class>-<year>.json (used by tests).
// Re-running it overwrites that file, so re-add any hand-written `knownMismatch` afterwards.
// Team names are written as the Team names in the hand-authored data/teams/<class>-<year>.json,
// mapping each spelling variant listed there; Teams it does not list are written as spelled and
// make the data build fail until they are added to it.
// The output is a first draft: correct it by hand against motogp.com before it is published.
// Reads two kinds of Season:
//   motogp  - Sprint + Grand Prix race (2023 onwards), from the Grand Prix report articles
//   500cc   - one Grand Prix race per Round, from the 500cc classification of each report article;
//             calendar rounds without a 500cc race (e.g. Yugoslavia and Spain 1976) are left out
//             and the remaining Rounds renumbered, as the championship itself counted them.
// The Scoring rule reference and Counting windows are NOT guessed: set them by hand in the output.
//
//   npm run data:load-wikipedia -- 500cc 1989 --classic
// reads 500cc Seasons whose report articles label their columns instead of using the 1976 layout:
// the "500cc classification" table by header names (1989), or, when the report article lists fewer
// riders, the season article's final-standings matrix, which flags fastest laps in italics (1949).
// A matrix column nobody has a Result in (1973 Nations, cancelled) becomes a Non-championship round with no Sessions; a column that
// links an earlier column's article (East German, 1969-1971) takes the matrix's Results alone.
// Half points, aggregate classifications and the Scoring rule are not detected: set them by hand.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { canonicalTeamName } from '../logic/canonical-team-name';
import { extractReportTitles } from '../logic/extract-report-titles';
import { firstPerRider } from '../logic/first-per-rider';
import { matrixRoundTitles } from '../logic/matrix-round-titles';
import { parseCalendar } from '../logic/parse-calendar';
import { parseClassicClassification } from '../logic/parse-classic-classification';
import { parseClassicOfficialTable } from '../logic/parse-classic-official-table';
import { parseOfficialTable } from '../logic/parse-official-table';
import { parseRound } from '../logic/parse-round';
import { parseStandingsMatrix } from '../logic/parse-standings-matrix';
import { seasonUrl } from '../logic/season-url';
import { slugify } from '../logic/slugify';
import type { RiderFile } from '../types/rider-file';
import type { TeamFile } from '../types/team-file';

const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'motogp-seasons-loader/0.1 (https://github.com/alessiogs/motogp-seasons)';

const CLASSES: Record<string, { seasonTitle: (year: number) => string; scoringRule: string; standingsHeading: string | string[] }> = {
  // Up to 2011 the MotoGP Season shares one article with the lower classes.
  motogp: { seasonTitle: (y) => (y <= 2011 ? `${y} Grand Prix motorcycle racing season` : `${y} MotoGP World Championship`), scoringRule: '2023-plus', standingsHeading: "Riders' standings" },
  '500cc': { seasonTitle: (y) => `${y} Grand Prix motorcycle racing season`, scoringRule: '1976', standingsHeading: ['500cc final standings', "500cc riders' standings", "Riders' standings/500cc"] },
};


async function main() {
  const [classCode, yearArg] = process.argv.slice(2);
  const year = Number(yearArg);
  const classic = process.argv.includes('--classic');
  const config = CLASSES[classCode];
  if (!config || !Number.isInteger(year) || (classic && classCode !== '500cc')) {
    console.error(`Usage: npm run data:load-wikipedia -- <${Object.keys(CLASSES).join('|')}> <year> [--classic (500cc only)]`);
    process.exit(1);
  }
  const dataDir = path.join(process.cwd(), 'data');
  const ridersPath = path.join(dataDir, 'riders.json');
  const riders: RiderFile[] = existsSync(ridersPath) ? JSON.parse(readFileSync(ridersPath, 'utf8')) : [];
  // A Rider merged by hand keeps the other article title as sourceIds.wikipedia2, wikipedia3, ...: all of them name him.
  const riderIdByWikipedia = new Map(
    riders.flatMap((r) => Object.entries(r.sourceIds).filter(([key]) => key.startsWith('wikipedia')).map(([, title]) => [title, r.id] as const)),
  );
  const claimedIds = new Set(riders.map((r) => r.id));

  /** Stable Rider ID for a Wikipedia article title; creates the Rider when new. */
  function riderId(articleTitle: string, displayName: string): string {
    const known = riderIdByWikipedia.get(articleTitle);
    if (known) return known;
    // Articles link the same person with and without a "(motorcyclist)" suffix, so the
    // name decides identity. Two different people sharing a name must be split by hand.
    const id = slugify(displayName);
    if (claimedIds.has(id)) {
      riderIdByWikipedia.set(articleTitle, id);
      return id;
    }
    claimedIds.add(id);
    riderIdByWikipedia.set(articleTitle, id);
    riders.push({ id, name: displayName, sourceIds: { wikipedia: articleTitle } });
    return id;
  }

  const seasonTitle = config.seasonTitle(year);
  const seasonText = await fetchWikitext(seasonTitle);
  const reportTitles = extractReportTitles(seasonText);
  if (reportTitles.length === 0) throw new Error(`No Grand Prix report links found on ${seasonTitle}`);

  const rounds: unknown[] = [];
  let scoringRule = config.scoringRule;
  let notes = `Loaded from Wikipedia (${seasonTitle}); needs a hand check against motogp.com.`;
  if (classic) {
    scoringRule = 'TODO-set-by-hand';
    notes += ' Set the Scoring rule, Half points and aggregate classifications by hand.';
    const calendar = parseCalendar(seasonText, year);
    // The matrix columns are the Rounds that had a 500cc race; the season article links more reports (other classes, cancelled races).
    const matrixTitles = matrixRoundTitles(seasonText);
    const roundTitles = matrixTitles.length > 0 ? matrixTitles : reportTitles;
    const matrix = parseStandingsMatrix(seasonText, roundTitles.length, riderId);
    let previousCalendarIndex = -1;
    for (const [i, title] of roundTitles.entries()) {
      // A column linking an article an earlier column already named (the East German column of 1969-1971 links the West German
      // article) is on the calendar right after the previous column, and its Results are the matrix's alone.
      const repeated = roundTitles.indexOf(title) < i;
      const calendarIndex = reportTitles.includes(title) && !repeated ? reportTitles.indexOf(title) : matrixTitles.length > 0 ? previousCalendarIndex + 1 : i;
      previousCalendarIndex = calendarIndex;
      console.error(`Round ${i + 1}: ${title}`);
      // Some 1979-1982 report articles do not exist: the standings matrix alone then gives the Round's Results.
      const text = repeated
        ? null
        : await fetchWikitext(title).catch((err: Error) => {
            console.error(`  ${err.message}; using the standings matrix only`);
            return null;
          });
      const classification = text == null ? [] : firstPerRider(parseClassicClassification(text, seasonUrl(title), riderId));
      // The fuller of the two wins; the matrix is the only one that flags the fastest lap.
      const fromMatrix = matrix.resultsForRound(i, seasonUrl(seasonTitle));
      const results = classification.length >= fromMatrix.length ? classification : fromMatrix;
      const entry = calendar[calendarIndex];
      const round = {
        number: rounds.length + 1,
        name: entry?.name ?? title,
        circuit: entry?.circuit ?? null,
        country: entry?.country ?? null,
        date: entry?.date ?? null,
        nonChampionship: false,
        notes: null as string | null,
        sessions: [] as unknown[],
      };
      if (results.length === 0) {
        // A matrix column nobody has a Result in is a race that was not run (1973 Nations): a Non-championship round keeps its number.
        // Without a matrix the calendar weekend simply had no 500cc race: it is not a Round, so the next ones move up.
        if (matrixTitles.length === 0) {
          console.error(`  no 500cc results, skipped`);
          continue;
        }
        console.error(`  no 500cc results in its matrix column: Non-championship round`);
        round.nonChampionship = true;
        round.notes = 'The 500cc race was not run (no Results in the standings matrix); the Round keeps its number. Needs a hand note.';
      } else {
        round.sessions = [{ type: 'grand-prix-race', order: 1, date: entry?.date ?? null, pointsMultiplier: 1, notes: null, results }];
      }
      rounds.push(round);
    }
  } else {
    for (const title of reportTitles) {
      console.error(`Report: ${title}`);
      const text = await fetchWikitext(title);
      const round = parseRound(rounds.length + 1, title, year, text, riderId, classCode);
      if (round) rounds.push(round);
      else console.error(`  no ${classCode} classification, skipped`);
    }
  }

  const teamsPath = path.join(dataDir, 'teams', `${classCode}-${year}.json`);
  const teamData: TeamFile = existsSync(teamsPath) ? JSON.parse(readFileSync(teamsPath, 'utf8')) : { teams: [] };
  for (const round of rounds as { sessions: { results: { team: string | null }[] }[] }[]) {
    for (const session of round.sessions) {
      for (const result of session.results) result.team = canonicalTeamName(result.team, teamData);
    }
  }

  const seasonFile = { class: classCode, year, scoringRule, notes, rounds };

  // 1977-1979 and 1988 write rows the "!" reader skips (no position cell for tied Riders, inline "||" cells): the classic reader takes the fuller table.
  let official = classic ? parseClassicOfficialTable(seasonText, riderId) : parseOfficialTable(seasonText, riderId, config.standingsHeading);
  if (!classic && classCode === '500cc') {
    const fuller = (() => {
      try {
        return parseClassicOfficialTable(seasonText, riderId);
      } catch {
        return []; // no 500cc matrix in this article
      }
    })();
    if (fuller.length > official.length) official = fuller;
  }

  mkdirSync(path.join(dataDir, 'seasons'), { recursive: true });
  mkdirSync(path.join(dataDir, 'official-tables'), { recursive: true });
  writeFileSync(path.join(dataDir, 'seasons', `${classCode}-${year}.json`), JSON.stringify(seasonFile, null, 2) + '\n');
  writeFileSync(
    path.join(dataDir, 'official-tables', `${classCode}-${year}.json`),
    JSON.stringify({ source: seasonUrl(seasonTitle), standings: official }, null, 2) + '\n',
  );
  writeFileSync(ridersPath, JSON.stringify(riders, null, 2) + '\n');
  console.error(`Wrote ${rounds.length} rounds and ${riders.length} riders. Review the diff and correct by hand.`);
}

// ---------------------------------------------------------------------------- fetching

async function fetchWikitext(title: string): Promise<string> {
  const url = `${API}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&redirects=1&format=json&formatversion=2`;
  let res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  // Wikipedia rate-limits a Season's dozens of Round pages with 429s: back off and retry.
  for (let attempt = 1; res.status === 429 && attempt <= 6; attempt++) {
    const retryAfter = Number(res.headers.get('retry-after'));
    await new Promise((r) => setTimeout(r, (retryAfter > 0 ? retryAfter : 2 ** attempt) * 1000));
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  }
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status} for ${title}`);
  const json = (await res.json()) as { parse?: { wikitext: string }; error?: { info: string } };
  if (!json.parse) throw new Error(`Wikipedia: ${json.error?.info ?? 'no page'} (${title})`);
  await new Promise((r) => setTimeout(r, 150));
  return json.parse.wikitext;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
