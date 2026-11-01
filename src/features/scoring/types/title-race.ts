import type { TitleCondition } from './title-condition';

export interface TitleRace {
  worldChampion: string | null;
  titleChances: string[];
  titleConditions: TitleCondition[];
}
