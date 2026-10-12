import type { Watched } from '../lang/Watched';
import type { TargetsRecord } from './TargetsRecord';

/** Reads every set of targets ever issued. */
export interface TargetsHistoryReader {
  /** Oldest first, then the full list after each change. */
  watchTargetsHistory(): Watched<TargetsRecord[]>;
}
