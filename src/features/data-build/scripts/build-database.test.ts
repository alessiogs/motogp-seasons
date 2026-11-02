import { describe, expect, it } from 'vitest';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildDatabase } from './build-database';

const fixtureDir = path.join(process.cwd(), 'src/features/data-build/fixtures/mini');

function fixtureWithRuleValidFor(years: number[]) {
  const dir = mkdtempSync(path.join(tmpdir(), 'motogp-validfor-'));
  cpSync(fixtureDir, dir, { recursive: true });
  const rulePath = path.join(dir, 'scoring-rules', 'mini-rule.json');
  const rule = JSON.parse(readFileSync(rulePath, 'utf8'));
  writeFileSync(rulePath, JSON.stringify({ ...rule, validFor: years }));
  return dir;
}

describe('buildDatabase', () => {
  it('refuses a Season whose year is not in the Scoring rule\'s validFor list', () => {
    const dir = fixtureWithRuleValidFor([1998]);
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).toThrow(/only verified for 1998, not 1999/);
  });

  it('accepts a Season whose year is in the list', () => {
    const dir = fixtureWithRuleValidFor([1999, 2000]);
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).not.toThrow();
  });

  it('refuses a Result whose Team is not listed for its Season', () => {
    const dir = fixtureWithFirstResultTeam('Team C');
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).toThrow(/500cc-1999\.json: .*Team "Team C" is not listed/);
  });

  it('refuses a Result that names a Team by a spelling variant, pointing at its Team name', () => {
    const dir = fixtureWithFirstResultTeam('TEAM A');
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).toThrow(/Team "TEAM A" is a spelling of "Team A"/);
  });

  it('refuses a Season with no Team data', () => {
    const dir = copyOfFixture();
    rmSync(path.join(dir, 'teams', '500cc-1999.json'));
    expect(() => buildDatabase(dir, path.join(dir, 'out.db'))).toThrow(/500cc-1999\.json: no Team data/);
  });
});

function copyOfFixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'motogp-fixture-'));
  cpSync(fixtureDir, dir, { recursive: true });
  return dir;
}

function fixtureWithFirstResultTeam(team: string) {
  const dir = copyOfFixture();
  const seasonPath = path.join(dir, 'seasons', '500cc-1999.json');
  const season = JSON.parse(readFileSync(seasonPath, 'utf8'));
  season.rounds[0].sessions[0].results[0].team = team;
  writeFileSync(seasonPath, JSON.stringify(season));
  return dir;
}
