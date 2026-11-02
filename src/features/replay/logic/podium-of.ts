import type { ClassificationRow } from '../types/classification-row';
import type { PodiumStep } from '../types/podium-step';

/**
 * The Podium of a Classification in display order 2nd, 1st, 3rd: its first three Classified Riders, empty steps for
 * the missing ones. The Podium is the top of the Classification, so each Rider shows that Result's own Bike number,
 * exception and Team colour.
 */
export function podiumOf(rows: ClassificationRow[]): PodiumStep[] {
  const classified = rows.filter((r) => r.outcomeLabel === null).slice(0, 3);
  return ([2, 1, 3] as const).map((place) => {
    const row = classified[place - 1];
    return {
      place,
      rider: row
        ? {
            riderId: row.riderId,
            team: row.team,
            manufacturer: row.manufacturer,
            bikeNumber: row.bikeNumber,
            numberException: row.numberException,
            box: row.box,
          }
        : null,
    };
  });
}
