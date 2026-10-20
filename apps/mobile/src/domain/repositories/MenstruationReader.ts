import type { Watched } from '../../lang/Watched';
import type { MenstruationDay } from '../MenstruationDay';

/** Reads the days marked with menstrual flow (MM-20). */
export interface MenstruationReader {
  /** Every flow day, oldest first, then the full list after each change. */
  watchFlowDays(): Watched<MenstruationDay[]>;
}
