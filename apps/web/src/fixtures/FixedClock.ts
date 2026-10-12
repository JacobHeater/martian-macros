import type { CalendarDate } from '../domain/CalendarDate';
import type { Clock } from '../domain/integration/Clock';

/** A `Clock` fixed at a day you choose, that you can move. */
export class FixedClock implements Clock {
  private day: CalendarDate;
  private elapsedMs = 0;

  /**
   * The hour of the day `now` reports. Noon unless a test is about the time
   * of day.
   */
  readonly hour: number;

  constructor(today: CalendarDate, { hour = 12 }: { hour?: number } = {}) {
    this.day = today;
    this.hour = hour;
  }

  advanceTo(day: CalendarDate): void {
    this.day = day;
  }

  /** Moves `now` later within the day, for a test about elapsed time. */
  elapseMs(timeMs: number): void {
    this.elapsedMs += timeMs;
  }

  today(): CalendarDate {
    return this.day;
  }

  now(): Date {
    return new Date(new Date(this.day.year, this.day.month - 1, this.day.day, this.hour).getTime() + this.elapsedMs);
  }
}
