import { listSeasons } from '@/features/seasons/queries/list-seasons';
import SeasonList from '@/features/seasons/components/season-list';

export default function Home() {
  return <SeasonList seasons={listSeasons()} />;
}
