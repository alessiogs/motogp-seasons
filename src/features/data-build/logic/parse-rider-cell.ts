import { stripMarkup } from './strip-markup';

/** Rider named in a table cell, linked or not (minor riders have no article): the article title (or name) and display name. */
export function parseRiderCell(cell: string): { title: string; name: string } | null {
  const link = cell.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  if (link) return { title: link[1], name: (link[2] ?? link[1]).replace(/\s*\(.*\)$/, '').trim() };
  const bare = cell.replace(/^[^|[{]*=[^|[{]*\|(?!\|)/, ''); // leading cell attributes: style="..." nowrap|
  const name = stripMarkup(bare.replace(/\{\{\s*flagicon[^}]*\}\}/gi, '')).replace(/\(.*\)/, '').trim();
  return name ? { title: name, name } : null;
}
