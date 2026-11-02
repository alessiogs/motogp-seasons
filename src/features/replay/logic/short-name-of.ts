/**
 * A Rider's short name as TV graphics show it on narrow screens: first initial and three letters of the surname,
 * "F BAG" for Francesco Bagnaia. The surname is everything after the first word, skipping lowercase particles
 * (van, der, de); `abbreviation` overrides the three letters when that rule picks the wrong word.
 */
export function shortNameOf(name: string, abbreviation: string | null): string {
  const [first, ...rest] = name.trim().split(/\s+/);
  const initial = first.charAt(0).toUpperCase();
  if (abbreviation) return `${initial} ${abbreviation.toUpperCase()}`;
  if (rest.length === 0) return letters(first).slice(0, 3);
  const start = rest.findIndex((w) => w !== w.toLowerCase());
  const surname = rest.slice(Math.max(start, 0));
  return `${initial} ${letters(surname.join('')).slice(0, 3)}`;
}

/** Uppercase letters only, accents removed: "Márquez" -> "MARQUEZ". */
function letters(text: string): string {
  return text.normalize('NFD').replace(/[^\p{L}]/gu, '').toUpperCase();
}
