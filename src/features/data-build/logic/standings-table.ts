import { extractTables } from './extract-tables';

export function standingsTable(seasonText: string) {
  const table = extractTables(seasonText).find(
    (t) => /500\s*cc/i.test(t.path.join(' ')) && /standings/i.test(t.path.join(' ')) && /Pts/.test(t.text),
  );
  // An unclosed wrapper table (1989) runs on into the next classes: stop at the next heading.
  return table && { ...table, text: table.text.split(/^=+[^=\n].*$/m)[0] };
}
