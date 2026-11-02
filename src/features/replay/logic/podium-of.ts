import type { ClassificationRow } from '../types/classification-row';
import type { PodiumStep } from '../types/podium-step';
import type { RiderInfo } from '../types/rider-info';

/** The Podium of a Classification in display order 2nd, 1st, 3rd: its first three Classified Riders, empty steps for the missing ones. */
export function podiumOf(rows: ClassificationRow[], riders: Record<string, RiderInfo>): PodiumStep[] {
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
            seasonNumber: riders[row.riderId]?.seasonNumber ?? null,
          }
        : null,
    };
  });
}
