import { beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from '@/features/data-build/scripts/build-database';
import { listSeasons } from './list-seasons';

// The real data: the home page lists a Season for every year of the Premier class, 1949 (500cc) to 2025 (MotoGP from 2002).
beforeAll(() => {
  const dbPath = path.join(mkdtempSync(path.join(tmpdir(), 'motogp-premier-')), 'premier.db');
  buildDatabase(path.join(process.cwd(), 'data'), dbPath);
  process.env.MOTOGP_DB_PATH = dbPath;
});

describe('listSeasons on the real data', () => {
  it('lists every Premier-class Season from 1949 to 2025, one per year', () => {
    const seasons = listSeasons();
    const years = (classCode: string) => seasons.filter((s) => s.classCode === classCode).map((s) => s.year);
    expect(years('500cc')).toEqual(Array.from({ length: 2001 - 1949 + 1 }, (_, i) => 1949 + i));
    expect(years('motogp')).toEqual(Array.from({ length: 2025 - 2002 + 1 }, (_, i) => 2002 + i));
    expect(seasons).toHaveLength(77);
  });
});
