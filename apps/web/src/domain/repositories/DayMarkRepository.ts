import type { DayMarkReader } from './DayMarkReader';
import type { DayMarkWriter } from './DayMarkWriter';

/** Reads and writes day completeness marks. */
export interface DayMarkRepository extends DayMarkReader, DayMarkWriter {}
