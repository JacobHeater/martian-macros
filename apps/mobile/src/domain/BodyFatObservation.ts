import type { BodyFatMethod } from './BodyFatMethod';
import type { CalendarDate } from './CalendarDate';

/**
 * A body-fat estimate from any method. Each device gets its own bias state,
 * so switching scales never reads as a body-composition change.
 */
export interface BodyFatObservation {
  readonly date: CalendarDate;
  readonly percent: number;
  readonly method: BodyFatMethod;
  readonly deviceId?: string | undefined;
}
