import { describe, expect, it } from 'vitest';
import { shortNameOf } from './short-name-of';

describe('shortNameOf: TV-style short name, first initial and three letters of the surname', () => {
  it.each([
    ['Francesco Bagnaia', 'F BAG'],
    ['Marc Márquez', 'M MAR'],
    ['Fabio Di Giannantonio', 'F DIG'],
    ['Boet van Dulmen', 'B DUL'],
    ['Piet van der Wal', 'P WAL'],
    ['Javier de Ortueta', 'J ORT'],
    ['Fernando González de Nicolás', 'F GON'],
    ['Takaaki Nakagami', 'T NAK'],
    ['Jean-Philippe Ruggia', 'J RUG'],
    ['Ago', 'AGO'],
  ])('%s -> %s', (name, short) => {
    expect(shortNameOf(name, null)).toBe(short);
  });

  it('uses the recorded abbreviation when the surname is not the second word', () => {
    expect(shortNameOf('Georg Robert Jung', 'JUN')).toBe('G JUN');
  });
});
