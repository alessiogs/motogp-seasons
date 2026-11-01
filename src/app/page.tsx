import { listPremierSeasons } from '@/features/seasons/queries/list-premier-seasons';
import SeasonList from '@/features/seasons/components/season-list';

export default function Home() {
  return <SeasonList seasons={listPremierSeasons()} />;
}
