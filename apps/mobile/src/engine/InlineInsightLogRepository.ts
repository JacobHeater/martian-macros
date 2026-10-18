import type { InlineInsightLogReader } from './InlineInsightLogReader';
import type { InlineInsightLogWriter } from './InlineInsightLogWriter';

/** Reads and writes the log of inline insights shown. */
export interface InlineInsightLogRepository extends InlineInsightLogReader, InlineInsightLogWriter {}
