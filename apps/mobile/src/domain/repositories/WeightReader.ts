import type { Watched } from '../../lang/Watched';
import type { WeightObservation } from '../WeightObservation';

/** Reads weigh-ins. */
export interface WeightReader {
  /** Every weigh-in, oldest first, then the full list after each change. */
  watchWeights(): Watched<WeightObservation[]>;
}
