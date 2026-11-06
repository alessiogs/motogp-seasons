/** Content of one wikitable cell line, without its attributes. */
export function cellText(line: string): string {
  const m = line.match(/^[!|]\s*(?:(?:[a-z-]+(?:=(?:"[^"]*"|[^\s"|]+))?\s*)+\|(?!\|))?\s*(.*)$/i);
  return (m ? m[1] : line).replace(/\{\{(?:efn|refn)[^}]*\}\}/gi, '').replace(/<ref[^>]*\/>|<ref[^>]*>.*?<\/ref>/g, '').replace(/'''/g, '').trim();
}
