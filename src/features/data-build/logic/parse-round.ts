import { extractTables } from './extract-tables';
import { parseClassification } from './parse-classification';
import { stripMarkup } from './strip-markup';
import { toIsoDate } from './to-iso-date';

export function parseRound(
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
  // 2023 on files the race under "Race" > "MotoGP"; 2013-2022 (no Sprint) under "Classification" or "Race results" > "MotoGP".
  const raceTable = tables.find((t) => t.path[0] === 'Race' && t.path[t.path.length - 1] === 'MotoGP')
    ?? tables.find((t) => t.path.includes('Race') && t.path.includes('MotoGP'))
    ?? tables.find((t) => /^(classification|race results)$/i.test(t.path[0]) && t.path[t.path.length - 1] === 'MotoGP');
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
    type: 'grand-prix-race', order: sessions.length + 1, date, pointsMultiplier: 1, notes: null,
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
