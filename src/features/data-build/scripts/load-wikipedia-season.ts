// Loads a Season from Wikipedia into data/ for review (ADR-0007). motogp.com is never fetched.
//
//   npm run data:load-wikipedia -- motogp 2024
//
// Writes data/seasons/<class>-<year>.json, adds new Riders to data/riders.json and writes the
// official final table seen on Wikipedia to data/official-tables/<class>-<year>.json (used by tests).
// The output is a first draft: correct it by hand against motogp.com before it is published.
// Reads two kinds of Season:
//   motogp  - Sprint + Grand Prix race (2023 onwards), from the Grand Prix report articles
//   500cc   - one Grand Prix race per Round, from the 500cc classification of each report article;
//             calendar rounds without a 500cc race (e.g. Yugoslavia and Spain 1976) are left out
//             and the remaining Rounds renumbered, as the championship itself counted them.
// The Scoring rule reference and Counting windows are NOT guessed: set them by hand in the output.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'motogp-seasons-loader/0.1 (https://github.com/alessiogs/motogp-seasons)';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CLASSES: Record<string, { seasonTitle: (year: number) => string; scoringRule: string; standingsHeading: string }> = {
  motogp: { seasonTitle: (y) => `${y} MotoGP World Championship`, scoringRule: '2023-plus', standingsHeading: "Riders' standings" },
  '500cc': { seasonTitle: (y) => `${y} Grand Prix motorcycle racing season`, scoringRule: '1976', standingsHeading: '500cc final standings' },
};

interface RiderFile { id: string; name: string; sourceIds: Record<string, string> }
interface ResultOut {
  rider: string; position: number | null; outcome: string; fastestLap: boolean; pointsOverride: null;
  team: string | null; manufacturer: string | null; bikeNumber: number | null; nationality: string | null; source: string;
}

async function main() {
  const [classCode, yearArg] = process.argv.slice(2);
  const year = Number(yearArg);
  const config = CLASSES[classCode];
  if (!config || !Number.isInteger(year)) {
    console.error(`Usage: npm run data:load-wikipedia -- <${Object.keys(CLASSES).join('|')}> <year>`);
    process.exit(1);
  }
  const dataDir = path.join(process.cwd(), 'data');
  const ridersPath = path.join(dataDir, 'riders.json');
  const riders: RiderFile[] = existsSync(ridersPath) ? JSON.parse(readFileSync(ridersPath, 'utf8')) : [];
  const riderIdByWikipedia = new Map(riders.map((r) => [r.sourceIds.wikipedia, r.id]));
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

  const rounds = [];
  for (const title of reportTitles) {
    console.error(`Report: ${title}`);
    const text = await fetchWikitext(title);
    const round = parseRound(rounds.length + 1, title, year, text, riderId, classCode);
    if (round) rounds.push(round);
    else console.error(`  no ${classCode} classification, skipped`);
  }

  const seasonFile = {
    class: classCode,
    year,
    scoringRule: config.scoringRule,
    notes: `Loaded from Wikipedia (${seasonTitle}); needs a hand check against motogp.com.`,
    rounds,
  };

  const official = parseOfficialTable(seasonText, riderId, config.standingsHeading);

  mkdirSync(path.join(dataDir, 'seasons'), { recursive: true });
  mkdirSync(path.join(dataDir, 'official-tables'), { recursive: true });
  writeFileSync(path.join(dataDir, 'seasons', `${classCode}-${year}.json`), JSON.stringify(seasonFile, null, 2) + '\n');
  writeFileSync(
    path.join(dataDir, 'official-tables', `${classCode}-${year}.json`),
    JSON.stringify({ source: `https://en.wikipedia.org/wiki/${encodeURIComponent(seasonTitle.replaceAll(' ', '_'))}`, standings: official }, null, 2) + '\n',
  );
  writeFileSync(ridersPath, JSON.stringify(riders, null, 2) + '\n');
  console.error(`Wrote ${rounds.length} rounds and ${riders.length} riders. Review the diff and correct by hand.`);
}

// ---------------------------------------------------------------------------- fetching

async function fetchWikitext(title: string): Promise<string> {
  const url = `${API}?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&redirects=1&format=json&formatversion=2`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipedia returned ${res.status} for ${title}`);
  const json = (await res.json()) as { parse?: { wikitext: string }; error?: { info: string } };
  if (!json.parse) throw new Error(`Wikipedia: ${json.error?.info ?? 'no page'} (${title})`);
  await new Promise((r) => setTimeout(r, 150));
  return json.parse.wikitext;
}

// ---------------------------------------------------------------------------- parsing

/** Titles of the Grand Prix report articles, in Round order, from the season article's results table. */
function extractReportTitles(seasonText: string): string[] {
  return [...seasonText.matchAll(/\[\[([^\]|]+)\|Report\]\]/g)].map((m) => m[1]);
}

interface Table { path: string[]; preamble: string; text: string }

/** Every wikitable with the headings above it. */
function extractTables(wikitext: string): Table[] {
  const tables: Table[] = [];
  const headingPath: string[] = [];
  let preamble: string[] = [];
  let current: string[] | null = null;
  let depth = 0;
  let tablePath: string[] = [];
  for (const line of wikitext.split('\n')) {
    if (current) {
      current.push(line);
      if (line.startsWith('{|')) depth++;
      if (line.startsWith('|}') && --depth === 0) {
        tables.push({ path: tablePath, preamble: preamble.join('\n'), text: current.join('\n') });
        current = null;
      }
      continue;
    }
    const heading = line.match(/^(={2,6})\s*(.+?)\s*\1\s*$/);
    if (heading) {
      headingPath.length = heading[1].length - 2;
      headingPath[heading[1].length - 2] = heading[2];
      preamble = [];
    } else if (line.startsWith('{|')) {
      current = [line];
      depth = 1;
      tablePath = headingPath.filter(Boolean);
    } else {
      preamble.push(line);
    }
  }
  return tables;
}

function parseRound(
  number: number,
  title: string,
  year: number,
  text: string,
  riderId: (articleTitle: string, displayName: string) => string,
  classCode: string,
) {
  const infobox = (key: string) => text.match(new RegExp(`^\\|[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, 'mi'))?.[1].trim() || null;
  const date = toIsoDate(infobox('Date'), year);
  const source = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  const tables = extractTables(text).filter((t) => /Pos/.test(t.text.split('\n').slice(0, 12).join('\n')));

  if (classCode === '500cc') {
    const table = tables.find((t) => t.path.some((p) => /500(&nbsp;|\s)*cc\)?\s+classification/i.test(p)));
    if (!table) return null;
    return buildRound(number, title, infobox, date, [
      {
        type: 'grand-prix-race', order: 1, date, pointsMultiplier: 1, notes: null,
        results: parseClassification(table.text, source, riderId),
      },
    ]);
  }

  const sprintTable = tables.find((t) => t.path.some((p) => /sprint/i.test(p)) && !t.path.some((p) => /moto[23]/i.test(p)));
  const raceTable = tables.find((t) => t.path[0] === 'Race' && t.path[t.path.length - 1] === 'MotoGP')
    ?? tables.find((t) => t.path.includes('Race') && t.path.includes('MotoGP'));
  if (!raceTable) throw new Error(`${title}: no MotoGP race classification found`);

  const sessions = [];
  if (sprintTable) {
    const held = sprintTable.preamble.match(/held on ([A-Za-z]+ \d{1,2}|\d{1,2} [A-Za-z]+)/);
    sessions.push({
      type: 'sprint', order: 1, date: held ? toIsoDate(held[1], year) : null, pointsMultiplier: 1, notes: null,
      results: parseClassification(sprintTable.text, source, riderId),
    });
  }
  sessions.push({
    type: 'grand-prix-race', order: 2, date, pointsMultiplier: 1, notes: null,
    results: parseClassification(raceTable.text, source, riderId),
  });

  return buildRound(number, title, infobox, date, sessions);
}

function buildRound(
  number: number,
  title: string,
  infobox: (key: string) => string | null,
  date: string | null,
  sessions: object[],
) {
  const officialName = infobox('Official_Name');
  const location = infobox('Location') ?? '';
  return {
    number,
    name: officialName ? stripMarkup(officialName) : title,
    circuit: location ? stripMarkup(location.split(/<br\s*\/?>/)[0]) : null,
    country: infobox('flag'),
    date,
    nonChampionship: false,
    notes: null,
    sessions,
  };
}

function parseClassification(
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

function parseOfficialTable(
  seasonText: string,
  riderId: (articleTitle: string, displayName: string) => string,
  heading: string,
) {
  const table = extractTables(seasonText).find((t) => t.path.includes(heading) && /Pts|Points/.test(t.text) && /Rider/.test(t.text));
  if (!table) throw new Error(`${heading} table not found`);
  const standings: { position: number; rider: string; points: number }[] = [];
  for (const row of table.text.split(/^\|-.*$/m)) {
    const lines = row.split('\n');
    const headers = lines.filter((l) => l.startsWith('!')).map((l) => cellText(l));
    const riderLine = lines.find((l) => /flagicon/i.test(l) && /\[\[/.test(l));
    const link = riderLine?.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (!link || headers.length < 2 || !/^\d+$/.test(headers[0])) continue;
    const points = Number(headers[headers.length - 1]);
    if (Number.isNaN(points)) continue;
    standings.push({
      position: Number(headers[0]),
      rider: riderId(link[1], (link[2] ?? link[1]).replace(/\s*\(.*\)$/, '').trim()),
      points,
    });
  }
  return standings;
}

// ---------------------------------------------------------------------------- small helpers

/** Content of one wikitable cell line, without its attributes. */
function cellText(line: string): string {
  const m = line.match(/^[!|]\s*(?:(?:[a-z-]+(?:="[^"]*")?\s*)+\|(?!\|))?\s*(.*)$/i);
  return (m ? m[1] : line).replace(/\{\{(?:efn|refn)[^}]*\}\}/gi, '').replace(/<ref[^>]*\/>|<ref[^>]*>.*?<\/ref>/g, '').replace(/'''/g, '').trim();
}

function stripMarkup(s: string): string {
  return s
    .replace(/<ref[^>]*\/>|<ref[^>]*>.*?<\/ref>/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toOutcome(position: string): string {
  const p = position.toUpperCase();
  if (p === 'DSQ') return 'DSQ';
  if (p === 'NC') return 'NC';
  if (p === 'DNS' || p === 'WD' || p === 'DNQ') return 'DNS';
  return 'DNF';
}

function toIsoDate(text: string | null, year: number): string | null {
  // "10 March" or "March 10"
  const dayFirst = text?.match(/(\d{1,2})\s+([A-Za-z]+)/);
  const monthFirst = text?.match(/([A-Za-z]+)\s+(\d{1,2})/);
  const day = dayFirst?.[1] ?? monthFirst?.[2];
  const monthName = dayFirst?.[2] ?? monthFirst?.[1];
  if (!day || !monthName) return null;
  const month = MONTHS.findIndex((name) => name.toLowerCase() === monthName.toLowerCase());
  if (month === -1) return null;
  return `${year}-${String(month + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
