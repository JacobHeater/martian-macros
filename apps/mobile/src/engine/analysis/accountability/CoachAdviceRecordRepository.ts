import type { CoachAdviceRecordReader } from './CoachAdviceRecordReader';
import type { CoachAdviceRecordWriter } from './CoachAdviceRecordWriter';

/** Reads and writes the coach's record of the advice it showed (MM-617). */
export interface CoachAdviceRecordRepository extends CoachAdviceRecordReader, CoachAdviceRecordWriter {}
