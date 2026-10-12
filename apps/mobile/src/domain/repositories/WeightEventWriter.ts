import type { WeightEvent } from '../WeightEvent';

/** Writes user-reported scale-weight events. */
export interface WeightEventWriter {
  /** Adds or replaces the event with the same date and type. */
  saveWeightEvent(event: WeightEvent): Promise<void>;

  /** Removes `event` if it is stored. */
  deleteWeightEvent(event: WeightEvent): Promise<void>;
}
