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
  ])('reads %s as %s', (machine, expected) => {
    expect(manufacturerOfMachine(machine)).toBe(expected);
  });

  it('returns null for an empty cell', () => {
    expect(manufacturerOfMachine('')).toBeNull();
    expect(manufacturerOfMachine(null)).toBeNull();
  });
});
