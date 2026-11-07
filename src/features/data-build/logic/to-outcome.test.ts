import { describe, expect, it } from 'vitest';
import { toOutcome } from './to-outcome';

describe('toOutcome', () => {
  it('reads the labels of unclassified positions', () => {
    expect(toOutcome('DSQ')).toBe('DSQ');
    expect(toOutcome('NC')).toBe('NC');
    expect(toOutcome('DNS')).toBe('DNS');
    expect(toOutcome('Ret')).toBe('DNF');
  });

  it('ignores the grid-order count some 2002-2012 articles append, as in "DSQ (20)" (2002 Spanish GP, Biaggi)', () => {
    expect(toOutcome('DSQ (20)')).toBe('DSQ');
    expect(toOutcome('Ret (20)')).toBe('DNF');
  });
});
