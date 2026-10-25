import type { CoachAdviceGiven } from './CoachAdviceGiven';

/** Records the advice the Coach tab showed (MM-617). The record only grows. */
export interface CoachAdviceRecordWriter {
  /**
   * Records `entries`, in their order, together. Each is kept once for its
   * food key, kind and day: recording one again that day changes nothing,
   * and the first one recorded stays.
   */
  recordAdviceGiven(entries: readonly CoachAdviceGiven[]): Promise<void>;
}
