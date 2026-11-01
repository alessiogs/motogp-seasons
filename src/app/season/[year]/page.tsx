import { getPremierSeason } from '@/features/seasons/queries/get-premier-season';
import { listPremierSeasons } from '@/features/seasons/queries/list-premier-seasons';
import SeasonView from '@/features/replay/components/season-view';

// Placeholder used only while the database has no seasons: static export
// fails if a dynamic route generates zero pages.
const EMPTY = 'none';

export const dynamicParams = false;

export function generateStaticParams() {
  const seasons = listPremierSeasons();
  if (seasons.length === 0) return [{ year: EMPTY }];
  return seasons.map((s) => ({ year: String(s.year) }));
}

export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  return <SeasonView season={year === EMPTY ? null : getPremierSeason(Number(year))} />;
}
