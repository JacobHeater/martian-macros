import type { InsightSnoozeReader } from './InsightSnoozeReader';
import type { InsightSnoozeWriter } from './InsightSnoozeWriter';

/** Reads and writes the snoozed inline insights. */
export interface InsightSnoozeRepository extends InsightSnoozeReader, InsightSnoozeWriter {}
