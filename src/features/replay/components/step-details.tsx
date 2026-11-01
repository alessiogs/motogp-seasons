import { podiumOf } from '../logic/podium-of';
import type { ClassificationRow } from '../types/classification-row';
import FlagBadge from './flag-badge';

interface Props {
  classification: ClassificationRow[];
  riders: Record<string, { name: string; nationality: string | null }>;
}

/** The Session behind the current Step: its Podium, and its full Classification in an accordion. */
export default function StepDetails({ classification, riders }: Props) {
  const podium = podiumOf(classification);
  const name = (id: string) => riders[id]?.name ?? id;

  return (
    <section className="step-details">
      <h2>Podium</h2>
      <ol className="podium">
        {podium.map((row) => (
          <li key={row.riderId}>
            <span className="podium-pos">{row.positionLabel}</span>
            <span className="podium-rider">
              <FlagBadge code={riders[row.riderId]?.nationality ?? null} /> {name(row.riderId)}
            </span>
            <span className="muted podium-team">{row.manufacturer ?? row.team}</span>
          </li>
        ))}
      </ol>

      <details className="classification">
        <summary>Full classification ({classification.length})</summary>
        <ol className="class-list">
          {classification.map((row) => (
            <li key={row.riderId}>
              <span className="class-pos">{row.positionLabel}</span>
              <span className="class-rider">
                <FlagBadge code={riders[row.riderId]?.nationality ?? null} /> {name(row.riderId)}
                {row.team && <span className="muted"> {row.team}</span>}
              </span>
              {row.outcomeLabel && <span className="class-outcome">{row.outcomeLabel}</span>}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
