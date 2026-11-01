import type { Outcome } from '@/features/seasons/types/outcome';
import type { Session } from '@/features/seasons/types/session';

export interface ClassificationRow {
  riderId: string;
  /** "1", "2", ... for a finishing position; an en dash when there is none. */
  positionLabel: string;
  /** Null for a normal finish; otherwise how the Result ended, in words. */
  outcomeLabel: string | null;
  team: string | null;
  manufacturer: string | null;
  bikeNumber: number | null;
}

const OUTCOME_LABELS: Record<Outcome, string | null> = {
  FIN: null,
  NC: 'Not classified',
  DNF: 'Did not finish',
  DNS: 'Did not start',
  DSQ: 'Disqualified',
};
const OUTCOME_ORDER: Outcome[] = ['FIN', 'NC', 'DNF', 'DNS', 'DSQ'];

/** The full Classification of a Session: finishers by position, then the other Outcomes. */
export function classificationOf(session: Session): ClassificationRow[] {
  return session.results
    .map((result, index) => ({ result, index }))
    .sort((a, b) => {
      const byOutcome = OUTCOME_ORDER.indexOf(a.result.outcome) - OUTCOME_ORDER.indexOf(b.result.outcome);
      if (byOutcome !== 0) return byOutcome;
      return (a.result.position ?? Infinity) - (b.result.position ?? Infinity) || a.index - b.index;
    })
    .map(({ result }) => ({
      riderId: result.riderId,
      positionLabel: result.outcome === 'FIN' && result.position != null ? String(result.position) : '–',
      outcomeLabel: OUTCOME_LABELS[result.outcome],
      team: result.team,
      manufacturer: result.manufacturer,
      bikeNumber: result.bikeNumber,
    }));
}

/** The top three finishers of a Classification. */
export function podiumOf(rows: ClassificationRow[]): ClassificationRow[] {
  return rows.filter((r) => r.outcomeLabel === null).slice(0, 3);
}
