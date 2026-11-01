export function toOutcome(position: string): string {
  const p = position.toUpperCase();
  if (p === 'DSQ') return 'DSQ';
  if (p === 'NC') return 'NC';
  if (p === 'DNS' || p === 'WD' || p === 'DNQ') return 'DNS';
  return 'DNF';
}
