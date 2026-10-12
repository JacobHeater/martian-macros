import type { CalendarDate } from './CalendarDate';
import type { WeightEventType } from './WeightEventType';

/** A dated note about a change in scale weight that may not reflect tissue. */
export interface WeightEvent {
  readonly date: CalendarDate;
  readonly type: WeightEventType;
}
