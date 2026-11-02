import { describe, expect, it } from 'vitest';
import type { TeamFile } from '../types/team-file';
import { canonicalTeamName } from './canonical-team-name';

const teams: TeamFile = {
  teams: [
    { name: 'Red Bull GASGAS Tech3', variants: ['Red Bull GasGas Tech3'] },
    { name: 'Aprilia Racing' },
  ],
};

describe('canonicalTeamName: the name the loader writes on a Result', () => {
  it('maps a spelling variant to its Team name', () => {
    expect(canonicalTeamName('Red Bull GasGas Tech3', teams)).toBe('Red Bull GASGAS Tech3');
  });

  it('keeps a Team name as it is', () => {
    expect(canonicalTeamName('Aprilia Racing', teams)).toBe('Aprilia Racing');
  });

  it('keeps a name the Team data does not know, for the data build to flag', () => {
    expect(canonicalTeamName('Trackhouse Racing', teams)).toBe('Trackhouse Racing');
  });

  it('keeps a Result with no Team without one', () => {
    expect(canonicalTeamName(null, teams)).toBeNull();
  });
});
