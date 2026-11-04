import { describe, expect, it } from 'vitest';
import { teamsWithSeveralManufacturers } from './teams-with-several-manufacturers';

describe('teamsWithSeveralManufacturers', () => {
  it('names a Team whose Results name more than one Manufacturer, Manufacturers by Result count', () => {
    const results = [
      { team: 'LCR', manufacturer: 'Honda' },
      { team: 'LCR', manufacturer: 'Aprilia' },
      { team: 'LCR', manufacturer: 'Honda' },
      { team: 'Gresini', manufacturer: 'Ducati' },
    ];
    expect(teamsWithSeveralManufacturers(results)).toEqual([
      { team: 'LCR', manufacturers: [{ name: 'Honda', results: 2 }, { name: 'Aprilia', results: 1 }] },
    ]);
  });

  it('ignores Results with no Team or no Manufacturer', () => {
    const results = [
      { team: 'LCR', manufacturer: 'Honda' },
      { team: 'LCR', manufacturer: null },
      { team: null, manufacturer: 'Aprilia' },
    ];
    expect(teamsWithSeveralManufacturers(results)).toEqual([]);
  });
});
