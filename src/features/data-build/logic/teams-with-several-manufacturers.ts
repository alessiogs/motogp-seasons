/**
 * The Teams whose Results in one Season name more than one Manufacturer, each with its
 * Manufacturers, most Results first. Usually a data slip (a Result copied from the wrong row),
 * sometimes real (a privateer changing bikes mid-season), so the data build warns rather than fails.
 */
export function teamsWithSeveralManufacturers(
  results: { team: string | null; manufacturer: string | null }[],
): { team: string; manufacturers: { name: string; results: number }[] }[] {
  const counts = new Map<string, Map<string, number>>();
  for (const { team, manufacturer } of results) {
    if (team == null || manufacturer == null) continue;
    const byManufacturer = counts.get(team) ?? new Map<string, number>();
    byManufacturer.set(manufacturer, (byManufacturer.get(manufacturer) ?? 0) + 1);
    counts.set(team, byManufacturer);
  }
  return [...counts]
    .filter(([, byManufacturer]) => byManufacturer.size > 1)
    .map(([team, byManufacturer]) => ({
      team,
      manufacturers: [...byManufacturer]
        .map(([name, n]) => ({ name, results: n }))
        .sort((a, b) => b.results - a.results),
    }));
}
