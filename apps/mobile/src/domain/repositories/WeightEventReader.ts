import type { Watched } from '../../lang/Watched';
import type { WeightEvent } from '../WeightEvent';

/** Reads user-reported scale-weight events. */
export interface WeightEventReader {
  /** Every event, oldest first, then the full list after each change. */
  watchWeightEvents(): Watched<WeightEvent[]>;
}
