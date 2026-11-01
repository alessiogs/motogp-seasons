/**
 * One entry per Rider: the first one wins. Sources list a Rider twice when a table runs on into other
 * classes, or when they have a Result and a later "Did not start" line in the same Session.
 */
export function firstPerRider<T extends { rider?: string; riderId?: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const id = (e.rider ?? e.riderId)!;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
