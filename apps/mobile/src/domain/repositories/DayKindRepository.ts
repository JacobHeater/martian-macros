import type { DayKindReader } from './DayKindReader';
import type { DayKindWriter } from './DayKindWriter';

/** Reads and writes the days marked a Refeed or a Day off (MM-611). */
export interface DayKindRepository extends DayKindReader, DayKindWriter {}
