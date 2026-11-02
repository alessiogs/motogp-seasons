import type { ClassificationRow } from '../types/classification-row';
import type { PodiumStep } from '../types/podium-step';
import type { RiderInfo } from '../types/rider-info';
import FlagBadge from './flag-badge';

interface Props {
  podium: PodiumStep[];
  belowPodium: ClassificationRow[];
  riders: Record<string, RiderInfo>;
}

const PLACE_NAMES = { 1: '1st', 2: '2nd', 3: '3rd' } as const;

/** The Session behind the current Step: a three-step Podium, and the rest of its Classification in an accordion. */
export default function StepDetails({ podium, belowPodium, riders }: Props) {
  const name = (id: string) => riders[id]?.name ?? id;

  return (
    <section className="step-details">
      <h2>Podium</h2>
      <ol className="podium">
        {podium.map(({ place, rider }) => (
          <li
            key={place}
            className={`podium-step podium-step-${place}${rider ? '' : ' empty'}`}
            aria-label={rider ? `${PLACE_NAMES[place]}: ${name(rider.riderId)}` : `${PLACE_NAMES[place]}: empty`}
          >
            <div className="podium-block slant">
              {rider && (
                <div className="podium-rider">
                  <span className="podium-name">
                    <FlagBadge code={riders[rider.riderId]?.nationality ?? null} /> {name(rider.riderId)}
                  </span>
                  <span className="podium-team">{rider.manufacturer ?? rider.team}</span>
                </div>
              )}
              <span className="podium-place display" aria-hidden="true">{place}</span>
            </div>
          </li>
        ))}
      </ol>

      {belowPodium.length > 0 && (
        <details className="classification">
          <summary>Rest of the classification ({belowPodium.length})</summary>
          <ol className="class-list">
            {belowPodium.map((row) => (
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
      )}
    </section>
  );
}
