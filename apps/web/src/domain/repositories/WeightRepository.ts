import type { WeightReader } from './WeightReader';
import type { WeightWriter } from './WeightWriter';

/** Reads and writes weigh-ins. */
export interface WeightRepository extends WeightReader, WeightWriter {}
