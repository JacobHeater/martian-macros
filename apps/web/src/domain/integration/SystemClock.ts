import { CalendarDate } from '../CalendarDate';
import type { Clock } from './Clock';

/** The real clock. */
export class SystemClock implements Clock {
  today(): CalendarDate {
    return CalendarDate.fromDate(this.now());
  }

  now(): Date {
    return new Date();
  }
}
