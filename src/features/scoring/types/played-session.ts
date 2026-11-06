import type { Round } from '@/features/seasons/types/round';
import type { Session } from '@/features/seasons/types/session';

export interface PlayedSession {
  round: Round;
  session: Session;
}
