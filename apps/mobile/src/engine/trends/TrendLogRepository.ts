import type { TrendLogReader } from './TrendLogReader';
import type { TrendLogWriter } from './TrendLogWriter';

/** Reads and writes the trend engine's announcement log and the findings dismissed (MM-605). */
export interface TrendLogRepository extends TrendLogReader, TrendLogWriter {}
