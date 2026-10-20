import type { SleepReader } from './SleepReader';
import type { SleepWriter } from './SleepWriter';

/** Reads and writes nights of sleep (MM-250). */
export interface SleepRepository extends SleepReader, SleepWriter {}
