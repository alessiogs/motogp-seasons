import type { ReplayStep } from '@/features/scoring/types/replay-step';
import { sessionLabel } from '../logic/session-label';
import { titleConditionLabel } from '../logic/title-condition-label';

interface Props {
  step: ReplayStep;
  /** The following Step, if any: the Title chance and Title condition look ahead to it. */
  next: ReplayStep | undefined;
  /** This Step is the one where the World Champion was crowned. */
  crowning: boolean;
  roundName: (roundNumber: number) => string;
  riderName: (riderId: string) => string;
  fastestLapBonus: boolean;
}

/** World Champion marker, Title chance announcements and Title conditions for the current Step. */
export default function TitleRacePanel({ step, next, crowning, roundName, riderName, fastestLapBonus }: Props) {
  const conditionOf = (riderId: string) => {
    const condition = step.titleConditions.find((c) => c.riderId === riderId);
    return condition && titleConditionLabel(condition, riderName, fastestLapBonus);
  };

  if (crowning && step.worldChampion) {
    return (
      <p className="title-race champion-banner" role="status">
        <span className="champion-badge">World Champion</span> {riderName(step.worldChampion)}
      </p>
    );
  }
  if (!next) return null;

  // A Round with one Session: the Title chance and its Title condition are one label.
  const singleSession = next.sessionsInRound === 1;
  const nextSession = sessionLabel(next.sessionType);

  if (step.titleChances.length > 0) {
    return (
      <section className="title-race" aria-label="Title chance">
        <h2>Title chance in {roundName(next.roundNumber)}</h2>
        <ul>
          {step.titleChances.map((riderId) => {
            const condition = conditionOf(riderId);
            return (
              <li key={riderId}>
                <strong>{riderName(riderId)}</strong>
                {condition && (
                  <>
                    {singleSession ? ': ' : <span className="muted"> · {nextSession}: </span>}
                    {condition}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  if (step.titleConditions.length > 0) {
    return (
      <section className="title-race" aria-label="Title condition">
        <h2>
          Title condition · {singleSession ? roundName(next.roundNumber) : nextSession}
        </h2>
        <ul>
          {step.titleConditions.map((c) => (
            <li key={c.riderId}>
              <strong>{riderName(c.riderId)}</strong>: {titleConditionLabel(c, riderName, fastestLapBonus)}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return null;
}
