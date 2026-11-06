import type { WikiTable } from '../types/wiki-table';
/** Every wikitable with the headings above it. */
export function extractTables(wikitext: string): WikiTable[] {
  const tables: WikiTable[] = [];
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
