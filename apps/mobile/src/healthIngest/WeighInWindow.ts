import { ArgumentError } from '../lang/ArgumentError';

const minutesInDay = 24 * 60;

/**
 * The hours in which an imported reading counts as the morning weigh-in
 * (MM-441): from `startMinute` up to, not including, `endMinute`, in
 * minutes after local midnight. Until the person moves it, it is
 * `WeighInWindow.usual`, 04:00 to 12:00 (MM-71).
 *
 * It never crosses midnight, so a reading always counts for the calendar
 * day it was taken on: it may begin at 00:00 and end at midnight (minute
 * 1440), but not run past it.
 */
export class WeighInWindow {
  /** MM-71's window: 04:00 to 12:00. */
  static readonly usual = new WeighInWindow({ startMinute: 4 * 60, endMinute: 12 * 60 });

  readonly startMinute: number;
  readonly endMinute: number;

  constructor({ startMinute, endMinute }: { startMinute: number; endMinute: number }) {
    if (!Number.isInteger(startMinute) || !Number.isInteger(endMinute)) {
      throw new ArgumentError('A weigh-in window starts and ends on a whole minute.');
    }
    if (startMinute < 0 || endMinute > minutesInDay || startMinute >= endMinute) {
      throw new ArgumentError('A weigh-in window starts before it ends, within one day.');
    }
    this.startMinute = startMinute;
    this.endMinute = endMinute;
  }

  /** Whether a reading taken at `at`, local time, is inside the window. */
  contains(at: Date): boolean {
    const minute = at.getHours() * 60 + at.getMinutes();
    return minute >= this.startMinute && minute < this.endMinute;
  }

  /** Whether `other` is the same window. */
  equals(other: WeighInWindow): boolean {
    return this.startMinute === other.startMinute && this.endMinute === other.endMinute;
  }
}
