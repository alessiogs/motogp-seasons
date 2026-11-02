import type { Season } from '@/features/seasons/types/season';

/**
 * Each Rider's Season number (ADR-0008): the Bike number on more than half of their Results.
 * Empty when the Season has none: some Result lacks a Bike number, or some Rider has no majority number.
 */
export function seasonNumbersOf(season: Season): Map<string, number> {
  const numbersByRider = new Map<string, number[]>();
  for (const round of season.rounds) {
    for (const session of round.sessions) {
      for (const result of session.results) {
        if (result.bikeNumber == null) return new Map();
        const numbers = numbersByRider.get(result.riderId) ?? [];
        numbers.push(result.bikeNumber);
        numbersByRider.set(result.riderId, numbers);
      }
    }
  }

  const seasonNumbers = new Map<string, number>();
  for (const [riderId, numbers] of numbersByRider) {
    const majority = numbers.find((n) => numbers.filter((m) => m === n).length * 2 > numbers.length);
    if (majority === undefined) return new Map();
    seasonNumbers.set(riderId, majority);
  }
  return seasonNumbers;
}
