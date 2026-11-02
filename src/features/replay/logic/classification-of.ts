import type { Outcome } from '@/features/seasons/types/outcome';
import type { ClassificationRow } from '../types/classification-row';
import type { Session } from '@/features/seasons/types/session';
import { boxColoursOf } from './box-colours-of';

const OUTCOME_LABELS: Record<Outcome, string | null> = {
  FIN: null,
  NC: 'Not classified',
  DNF: 'Did not finish',
  DNS: 'Did not start',
  DSQ: 'Disqualified',
};
const OUTCOME_ORDER: Outcome[] = ['FIN', 'NC', 'DNF', 'DNS', 'DSQ'];

/**
 * The full Classification of a Session: finishers by position, then the other Outcomes.
 * A Result whose Bike number differs from its Rider's Season number (seasonNumbers, from seasonNumbersOf) is an exception.
 */
export function classificationOf(session: Session, seasonNumbers: Map<string, number> = new Map()): ClassificationRow[] {
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
      numberException: seasonNumbers.has(result.riderId) && result.bikeNumber !== seasonNumbers.get(result.riderId),
      box: boxColoursOf(result.teamColour),
    }));
}
