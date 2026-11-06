/**
 * The pairs of Riders whose names match on surname and first initial once accents and case are
 * ignored, in file order. The first word of a name is the first name and the rest the surname, so
 * "Fabio Di Giannantonio" has the surname "di giannantonio". A pair is either one person spelled
 * two ways or two people sharing a name, which only a review can tell, so the data build warns
 * rather than fails.
 */
export function ridersWithMatchingNames<T extends { name: string }>(riders: T[]): [T, T][] {
  const byKey = new Map<string, T[]>();
  for (const rider of riders) {
    const key = matchKey(rider.name);
    byKey.set(key, [...(byKey.get(key) ?? []), rider]);
  }
  return [...byKey.values()].flatMap((group) =>
    group.flatMap((a, i) => group.slice(i + 1).map((b): [T, T] => [a, b])),
  );
}

function matchKey(name: string): string {
  const [first = '', ...surname] = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  return `${surname.join(' ')}|${first.charAt(0)}`;
}
