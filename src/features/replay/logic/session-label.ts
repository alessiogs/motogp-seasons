const LABELS: Record<string, string> = {
  sprint: 'Sprint',
  'grand-prix-race': 'Grand Prix race',
};

/** Human label of a Session type; an unknown type falls back to its own id. */
export function sessionLabel(type: string): string {
  return LABELS[type] ?? type;
}
