import { describe, expect, it } from 'vitest';
import { flagOf } from './flag';

describe('flagOf', () => {
  it('gives an emoji flag for a current country, whichever code spelling the source used', () => {
    expect(flagOf('ITA')).toMatchObject({ emoji: '🇮🇹', name: 'Italy' });
    expect(flagOf('SPA')).toMatchObject({ emoji: '🇪🇸', name: 'Spain' });
    expect(flagOf('ESP')).toMatchObject({ emoji: '🇪🇸', name: 'Spain' });
    expect(flagOf('RSA')).toMatchObject({ emoji: '🇿🇦' });
    expect(flagOf('SAF')).toMatchObject({ emoji: '🇿🇦' });
    expect(flagOf('PRT')).toMatchObject({ emoji: '🇵🇹' });
    expect(flagOf('POR')).toMatchObject({ emoji: '🇵🇹' });
  });

  it('keeps countries that no longer exist, by name, with a badge instead of an emoji', () => {
    expect(flagOf('TCH')).toEqual({ code: 'TCH', name: 'Czechoslovakia', emoji: null });
    expect(flagOf('GDR')).toEqual({ code: 'GDR', name: 'East Germany', emoji: null });
    expect(flagOf('YUG')).toEqual({ code: 'YUG', name: 'Yugoslavia', emoji: null });
  });

  it('shows West Germany under the black-red-gold flag it raced under', () => {
    expect(flagOf('FRG')).toMatchObject({ name: 'West Germany', emoji: '🇩🇪' });
  });

  it('never fails on an unknown code', () => {
    expect(flagOf('XYZ')).toEqual({ code: 'XYZ', name: 'XYZ', emoji: null });
  });

  it('is absent when the Rider has no Nationality', () => {
    expect(flagOf(null)).toBeNull();
  });
});
