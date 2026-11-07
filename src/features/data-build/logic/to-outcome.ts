export function toOutcome(position: string): string {
  // Some articles append a count to the label, as in "DSQ (20)".
  const p = position.toUpperCase().replace(/\s*\(\d+\)$/, '');
  if (p === 'DSQ') return 'DSQ';
  if (p === 'NC') return 'NC';
  if (p === 'DNS' || p === 'WD' || p === 'DNQ') return 'DNS';
  return 'DNF';
}
