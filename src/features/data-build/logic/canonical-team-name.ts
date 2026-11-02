import type { TeamFile } from '../types/team-file';

/**
 * The Team name to write on a Result for a source spelling: the Team's display name when the
 * spelling is one of its variants, otherwise the spelling unchanged (an unlisted Team is left for
 * the data build to reject).
 */
export function canonicalTeamName(sourceName: string | null, data: TeamFile): string | null {
  if (sourceName == null) return null;
  const team = data.teams.find((t) => t.variants?.includes(sourceName));
  return team ? team.name : sourceName;
}
