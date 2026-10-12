import type { WeightEventReader } from './WeightEventReader';
import type { WeightEventWriter } from './WeightEventWriter';

/** Reads and writes user-reported scale-weight events. */
export interface WeightEventRepository extends WeightEventReader, WeightEventWriter {}
