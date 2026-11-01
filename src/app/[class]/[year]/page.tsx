import { notFound } from 'next/navigation';
import { getSeason } from '@/features/seasons/queries/get-season';
import { listSeasons } from '@/features/seasons/queries/list-seasons';
import SeasonView from '@/features/replay/components/season-view';

export const dynamicParams = false;

export function generateStaticParams() {
  return listSeasons().map((s) => ({ class: s.classCode, year: String(s.year) }));
}

export default async function SeasonPage({ params }: { params: Promise<{ class: string; year: string }> }) {
  const { class: classCode, year } = await params;
  const season = getSeason(classCode, Number(year));
  if (!season) notFound();
  return <SeasonView season={season} />;
}
