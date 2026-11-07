import { describe, expect, it } from 'vitest';
import { manufacturerOfMachine } from './manufacturer-of-machine';

describe('manufacturerOfMachine', () => {
  it.each([
    ['YZR500', 'Yamaha'],
    ['RG500', 'Suzuki'],
    ['RGB500', 'Suzuki'],
    ['NS500/NSR500', 'Honda'],
    ['RS500', 'Honda'],
    ['GP500', 'Cagiva'],
    ['Elf3-RS500', 'Elf'],
    ['Chevallier-Honda NS500', 'Chevallier'],
    ['Sanvenero', 'Sanvenero'],
    ['Morbidelli', 'Morbidelli'],
    ['MV500', 'MV Agusta'],
    ['TR500', 'Suzuki'],
    ['H1R-RW', 'Kawasaki'],
    ['RR500', 'Harley-Davidson'],
    ['Matchless G50', 'Matchless'],
    ['Seeley TR500', 'Seeley'],
    ['Yamsel', 'Seeley'],
    ['Seeley-Matchless', 'Seeley'],
    ['Maxton-TZ350', 'Yamaha'],
    ['Coleman-Suzuki', 'Suzuki'],
    ['Kettle-Norton', 'Norton'],
    ['Kirby-Metisse', 'Métisse'],
    ['Münch-URS', 'Münch'],
    ['Aermacchi-Harley Davidson', 'Harley-Davidson'],
    ['Harley-Davidson', 'Harley-Davidson'],
    ['Husqvarna-Proto', 'Husqvarna'],
  ])('reads %s as %s', (machine, expected) => {
    expect(manufacturerOfMachine(machine)).toBe(expected);
  });

  // 1969-1972 matrices: a Rider who changed bikes has several in one cell, and the source gives no machine per Round.
  it.each([
    ['Bultaco / Kawasaki', 'Bultaco'],
    ['Linto / MV Agusta', 'Linto'],
    ['Suzuki / Jawa', 'Suzuki'],
    ['Norton / Manx', 'Norton'],
  ])('reads %s as the first bike named, %s', (machine, expected) => {
    expect(manufacturerOfMachine(machine)).toBe(expected);
  });

  it('returns null for an empty cell', () => {
    expect(manufacturerOfMachine('')).toBeNull();
    expect(manufacturerOfMachine(null)).toBeNull();
  });
});
