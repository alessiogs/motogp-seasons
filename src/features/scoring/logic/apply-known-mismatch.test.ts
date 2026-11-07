import { describe, expect, it } from 'vitest';
import { applyKnownMismatch } from './apply-known-mismatch';

const printed = [
  { rider: 'a', points: 100 },
  { rider: 'b', points: 89 },
  { rider: 'c', points: 50 },
];
const mismatch = { rider: 'b', replayedPoints: 90, printedPoints: 89, reason: 'Cells sum to 90' };

describe('applyKnownMismatch', () => {
  it('leaves a table without a known mismatch as printed, so a matching replay equals it', () => {
    expect(applyKnownMismatch(printed, undefined)).toEqual(printed);
  });

  it('expects the declared replayed points for that Rider, so a replay of exactly that is accepted', () => {
    const replayed = [
      { rider: 'a', points: 100 },
      { rider: 'b', points: 90 },
      { rider: 'c', points: 50 },
    ];
    expect(applyKnownMismatch(printed, mismatch)).toEqual(replayed);
  });

  it('still fails a replay that differs from the declared replayed points, even if it equals the printed ones', () => {
    expect(applyKnownMismatch(printed, mismatch)).not.toEqual(printed);
    const wrong = [
      { rider: 'a', points: 100 },
      { rider: 'b', points: 91 },
      { rider: 'c', points: 50 },
    ];
    expect(applyKnownMismatch(printed, mismatch)).not.toEqual(wrong);
  });

  it('still fails an undeclared mismatch for another Rider', () => {
    const other = [
      { rider: 'a', points: 99 },
      { rider: 'b', points: 90 },
      { rider: 'c', points: 50 },
    ];
    expect(applyKnownMismatch(printed, mismatch)).not.toEqual(other);
  });

  it('rejects a declaration whose printed points are not what the table prints, or whose Rider is absent', () => {
    expect(() => applyKnownMismatch(printed, { ...mismatch, printedPoints: 88 })).toThrow(/printed/);
    expect(() => applyKnownMismatch(printed, { ...mismatch, rider: 'z' })).toThrow(/z/);
  });

  it('accepts several declarations, one per Rider', () => {
    const second = { rider: 'c', replayedPoints: 48, printedPoints: 50, reason: 'Cells sum to 48' };
    expect(applyKnownMismatch(printed, [mismatch, second])).toEqual([
      { rider: 'a', points: 100 },
      { rider: 'b', points: 90 },
      { rider: 'c', points: 48 },
    ]);
    expect(() => applyKnownMismatch(printed, [mismatch, { ...second, printedPoints: 51 }])).toThrow(/printed/);
  });
});
