import type { RivalMargin, SessionResult, TitleCondition } from '@/features/scoring/types/title-condition';

/**
 * A Title condition as a sentence: "World Champion if he outscores Bezzecchi by 8 and Martín by 30".
 * `fastestLapBonus`: the Scoring rule pays one, so results are told apart by the fastest lap too.
 */
export function titleConditionLabel(
  condition: TitleCondition,
  name: (riderId: string) => string,
  fastestLapBonus = false,
): string {
  if (condition.kind === 'margin') {
    const { rivals } = condition;
    if (rivals.every((r) => r.margin > 0 && r.marginIfWins == null)) {
      return `World Champion if he outscores ${join(rivals.map((r) => `${name(r.rivalId)} by ${r.margin}`))}`;
    }
    return `World Champion if he ${join(rivals.map((r) => marginPhrase(r, name)))}`;
  }
  const clauses = condition.clauses.map((clause) => {
    const parts: string[] = [];
    if (clause.worst.position != null) parts.push(`he ${ownResult(clause.worst, fastestLapBonus)}`);
    for (const { rivalId, atBest } of clause.rivals) parts.push(`${name(rivalId)} ${rivalResult(atBest, fastestLapBonus)}`);
    return parts.length ? parts.join(' and ') : 'he starts';
  });
  return `World Champion if ${clauses.join(', or if ')}`;
}

function marginPhrase({ rivalId, margin, marginIfWins }: RivalMargin, name: (id: string) => string) {
  const rival = name(rivalId);
  const phrase = (m: number) =>
    m > 0 ? `outscores ${rival} by ${m}` : m === 0 ? `is not outscored by ${rival}` : `is not outscored by ${rival} by more than ${-m}`;
  if (marginIfWins == null) return phrase(margin);
  if (margin > 0 && marginIfWins > 0) return `outscores ${rival} by ${margin}, or by ${marginIfWins} if he wins`;
  return `${phrase(margin)}, or ${phrase(marginIfWins)} if he wins`;
}

/** His result `worst` or better. */
function ownResult({ position, fastestLap }: SessionResult, bonus: boolean) {
  const lap = bonus && fastestLap ? ' with the fastest lap' : '';
  if (position === 1) return `wins${lap}`;
  return `finishes ${ordinal(position!)}${lap} or better`;
}

/** The rival's result `atBest` or worse. */
function rivalResult({ position, fastestLap }: SessionResult, bonus: boolean) {
  if (position == null) return 'does not score';
  if (bonus && !fastestLap) return `finishes no better than ${ordinal(position)} without the fastest lap`;
  if (position === 2) return 'does not win';
  return `finishes no better than ${ordinal(position)}`;
}

function join(parts: string[]) {
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}
