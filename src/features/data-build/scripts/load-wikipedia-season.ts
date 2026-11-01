// Loads a Season from Wikipedia into data/ for review (ADR-0007). motogp.com is never fetched.
//
//   npm run data:load-wikipedia -- motogp 2024
//
// Writes data/seasons/<class>-<year>.json, adds new Riders to data/riders.json and writes the
// official final table seen on Wikipedia to data/official-tables/<class>-<year>.json (used by tests).
// The output is a first draft: correct it by hand against motogp.com before it is published.
// MotoGP-class seasons are read with Sprint + Grand Prix race (2023 onwards). 500cc Seasons have one
// Session per Round: the report articles' "500cc classification" tables when they carry one
// (1989), otherwise the season article's final-standings matrix, which only lists riders who
// scored in the Season (1949, whose report articles are too uneven). Half points, aggregate
// classifications and the Scoring rule are not detected: set them by hand.
//   npm run data:load-wikipedia -- 500cc 1989
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'motogp-seasons-loader/0.1 (https://github.com/alessiogs/motogp-seasons)';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface RiderFile { id: string; name: string; sourceIds: Record<string, string> }
interface ResultOut {
  rider: string; position: number | null; outcome: string; fastestLap: boolean; pointsOverride: null;
  team: string | null; manufacturer: string | null; bikeNumber: number | null; nationality: string | null; source: string;
}

async function main() {
  const [classCode, yearArg] = process.argv.slice(2);
  const year = Number(yearArg);
  if ((classCode !== 'motogp' && classCode !== '500cc') || !Number.isInteger(year)) {
    console.error('Usage: npm run data:load-wikipedia -- <motogp|500cc> <year>');
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

  const seasonTitle = classCode === 'motogp' ? `${year} MotoGP World Championship` : `${year} Grand Prix motorcycle racing season`;
  const seasonText = await fetchWikitext(seasonTitle);
  const reportTitles = extractReportTitles(seasonText);
  if (reportTitles.length === 0) throw new Error(`No Grand Prix report links found on ${seasonTitle}`);

  const rounds = [];
  let scoringRule = '2023-plus';
  let notes = `Loaded from Wikipedia (${seasonTitle}); needs a hand check against motogp.com.`;
  if (classCode === 'motogp') {
    for (const [i, title] of reportTitles.entries()) {
      console.error(`Round ${i + 1}: ${title}`);
      const text = await fetchWikitext(title);
      rounds.push(parseRound(i + 1, title, year, text, riderId));
    }
  } else {
    scoringRule = 'TODO-set-by-hand';
    const calendar = parseCalendar(seasonText, year);
    const matrix = parseStandingsMatrix(seasonText, reportTitles.length, riderId);
    for (const [i, title] of reportTitles.entries()) {
      console.error(`Round ${i + 1}: ${title}`);
      const text = await fetchWikitext(title);
      const source = seasonUrl(title);
      const classification = firstPerRider(parseClassicClassification(text, source, riderId));
      // The fuller of the two wins; the matrix is the only one that flags the fastest lap.
      const fromMatrix = matrix.resultsForRound(i, seasonUrl(seasonTitle));
      const results = classification.length >= fromMatrix.length ? classification : fromMatrix;
      rounds.push({
        number: i + 1,
        name: calendar[i]?.name ?? title,
        circuit: calendar[i]?.circuit ?? null,
        country: calendar[i]?.country ?? null,
        date: calendar[i]?.date ?? null,
        nonChampionship: false,
        notes: null,
        sessions: [{ type: 'grand-prix-race', order: 1, date: calendar[i]?.date ?? null, pointsMultiplier: 1, notes: null, results }],
      });
    }
    notes = `Loaded from Wikipedia (${seasonTitle}); needs a hand check against motogp.com. Set the Scoring rule, Half points and aggregate classifications by hand.`;
  }

  const seasonFile = { class: classCode, year, scoringRule, notes, rounds };

  const official = classCode === 'motogp'
    ? parseOfficialTable(seasonText, riderId)
    : parseClassicOfficialTable(seasonText, riderId);

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
) {
  const infobox = (key: string) => text.match(new RegExp(`^\\|[ \\t]*${key}[ \\t]*=[ \\t]*(.*)$`, 'mi'))?.[1].trim() || null;
  const date = toIsoDate(infobox('Date'), year);
  const source = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
  const tables = extractTables(text).filter((t) => /Pos/.test(t.text.split('\n').slice(0, 12).join('\n')));

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
    const classified = /^\d+$/.test(pos);
    results.push({
      rider: riderId(articleTitle, name),
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

function parseOfficialTable(seasonText: string, riderId: (articleTitle: string, displayName: string) => string) {
  const table = extractTables(seasonText).find((t) => t.path.includes("Riders' standings") && /Pts/.test(t.text) && /Rider/.test(t.text));
  if (!table) throw new Error("Riders' standings table not found");
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

// ---------------------------------------------------------------------------- 500cc seasons

function seasonUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

type RiderIdFn = (articleTitle: string, displayName: string) => string;

/** Date, Grand Prix name, circuit and country of every Round from the season article's calendar table. */
function parseCalendar(seasonText: string, year: number) {
  const table = extractTables(seasonText).find((t) => /calendar/i.test(t.path.join(' ')) && /Circuit/.test(t.text));
  if (!table) return [];
  const rounds: { name: string; circuit: string | null; country: string | null; date: string | null }[] = [];
  for (const row of table.text.split(/^\|-.*$/m)) {
    const lines = row.split('\n').filter((l) => /^[!|]/.test(l));
    const first = lines[0] && cellText(lines[0]);
    if (!first || !/^\d+$/.test(first)) continue;
    const [, date, grandPrix, circuit] = lines.map(cellText);
    rounds[Number(first) - 1] = {
      name: stripMarkup(grandPrix.replace(/\{\{flagicon[^}]*\}\}/gi, '')),
      circuit: stripMarkup(circuit) || null,
      country: grandPrix.match(/flagicon\|([^|}]+)/i)?.[1] ?? null,
      date: toIsoDate(date, year),
    };
  }
  return rounds;
}

/** A report article's "500cc classification" table, read by its header names. Empty if it has none. */
function parseClassicClassification(text: string, source: string, riderId: RiderIdFn): ResultOut[] {
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

/** Rider named in a table cell, linked or not (minor riders have no article): the article title (or name) and display name. */
function parseRiderCell(cell: string): { title: string; name: string } | null {
  const link = cell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (link) return { title: link[1], name: (link[2] ?? link[1]).replace(/\s*\(.*\)$/, '').trim() };
  const bare = cell.replace(/^[^|[{]*=[^|[{]*\|(?!\|)/, ''); // leading cell attributes: style="..." nowrap|
  const name = stripMarkup(bare.replace(/\{\{\s*flagicon[^}]*\}\}/gi, '')).replace(/\(.*\)/, '').trim();
  return name ? { title: name, name } : null;
}

/**
 * One entry per Rider: the first one wins. Sources list a Rider twice when a table runs on into other
 * classes, or when they have a Result and a later "Did not start" line in the same Session.
 */
function firstPerRider<T extends { rider?: string; riderId?: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const id = (e.rider ?? e.riderId)!;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Cells of every row of a table, with "||" inline separators expanded. */
function tableRows(tableText: string): string[][] {
  return tableText
    .split(/^\|-.*$/m)
    .map((row) =>
      row
        .split('\n')
        .filter((l) => /^[!|]/.test(l) && !/^\|[}+]/.test(l))
        .flatMap((l) => l.replace(/^[!|]/, '').split('||'))
        .map((c) => c.trim()),
    )
    .filter((cells) => cells.length > 0);
}

function standingsTable(seasonText: string) {
  const table = extractTables(seasonText).find(
    (t) => /500\s*cc/i.test(t.path.join(' ')) && /standings/i.test(t.path.join(' ')) && /Pts/.test(t.text),
  );
  // An unclosed wrapper table (1989) runs on into the next classes: stop at the next heading.
  return table && { ...table, text: table.text.split(/^=+[^=\n].*$/m)[0] };
}

/** The 500cc final-standings matrix of the season article: one cell per Round (position, "Ret", blank; italics = fastest lap). */
function parseStandingsMatrix(seasonText: string, roundCount: number, riderId: RiderIdFn) {
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

/** The 500cc final riders' standings table of the season article (positions and points). */
function parseClassicOfficialTable(seasonText: string, riderId: RiderIdFn) {
  const table = standingsTable(seasonText);
  if (!table) throw new Error("500cc riders' standings table not found");
  const standings: { position: number; rider: string; points: number }[] = [];
  for (const row of tableRows(table.text)) {
    const riderCell = row.find((c) => /flagicon/i.test(c) && !/<br/i.test(c));
    const who = riderCell ? parseRiderCell(riderCell) : null;
    const position = row[0] && cellText(`|${row[0]}`);
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
