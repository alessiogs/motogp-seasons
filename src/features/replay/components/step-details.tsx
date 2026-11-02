import type { BoxColours } from '../types/box-colours';
import type { ClassificationRow } from '../types/classification-row';
import type { PodiumStep } from '../types/podium-step';
import type { RiderInfo } from '../types/rider-info';
import FlagBadge from './flag-badge';
import NumBox from './num-box';

interface Props {
  podium: PodiumStep[];
  belowPodium: ClassificationRow[];
  riders: Record<string, RiderInfo>;
}

/** A Result shown with its Bike number: a Classification row or a Podium Rider. */
interface NumberedResult {
  bikeNumber: number;
  numberException: boolean;
  box: BoxColours;
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
                  {rider.bikeNumber != null && (
                    <ResultNumber
                      result={{ ...rider, bikeNumber: rider.bikeNumber }}
                      seasonNumber={riders[rider.riderId]?.seasonNumber ?? null}
                    />
                  )}
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
                  {row.bikeNumber != null && (
                    <ResultNumber result={{ ...row, bikeNumber: row.bikeNumber }} seasonNumber={riders[row.riderId]?.seasonNumber ?? null} />
                  )}
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

/** The Bike number of one Result in its Team colour, with a marker when it isn't the Rider's Season number. */
function ResultNumber({ result, seasonNumber }: { result: NumberedResult; seasonNumber: number | null }) {
  const { bikeNumber: number, box } = result;
  if (!result.numberException) {
    return <NumBox number={number} background={box.background} foreground={box.foreground} title={`Bike number ${number}`} />;
  }
  const note = `Bike number ${number}, not their Season number ${seasonNumber}`;
  return (
    <>
      <NumBox number={number} background={box.background} foreground={box.foreground} title={note} />
      <span className="num-exception" title={note}>
        *<span className="visually-hidden"> {note}</span>
      </span>
    </>
  );
}
