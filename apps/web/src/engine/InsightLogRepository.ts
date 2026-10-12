import type { InsightLogReader } from './InsightLogReader';
import type { InsightLogWriter } from './InsightLogWriter';

/** Reads and writes the log of shown insights. */
export interface InsightLogRepository extends InsightLogReader, InsightLogWriter {}
