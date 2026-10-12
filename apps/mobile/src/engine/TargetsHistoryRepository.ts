import type { TargetsHistoryReader } from './TargetsHistoryReader';
import type { TargetsHistoryWriter } from './TargetsHistoryWriter';

/** Reads and writes the history of issued targets. */
export interface TargetsHistoryRepository extends TargetsHistoryReader, TargetsHistoryWriter {}
