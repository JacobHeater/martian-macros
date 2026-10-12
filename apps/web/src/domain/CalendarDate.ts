import { ArgumentError } from '../lang/ArgumentError';
import { FormatError } from '../lang/FormatError';

const millisecondsPerDay = 86_400_000;
const known = new Map<number, CalendarDate>();

/**
 * A timezone-free calendar day.
 *
 * Daily logs, weigh-ins, and engine windows are keyed by the user's local
 * calendar day, not by instants, so DST shifts and travel never split or
 * merge days.
 *
 * There is one object per day: two dates for the same day are the same
 * object. So `===` compares days, and a date works as a `Map` key or a `Set`
 * member, as it did in Dart.
 */
export class CalendarDate {
  /** Days since 1970-01-01. */
  readonly epochDay: number;

  private constructor(epochDay: number) {
    this.epochDay = epochDay;
  }

  /** The day `year`-`month`-`day`, with January as month 1. */
  static of(year: number, month: number, day: number): CalendarDate {
    const utc = new Date(0);
    utc.setUTCFullYear(year, month - 1, day);
    if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
      throw new ArgumentError(`Invalid date: ${year}-${month}-${day}`);
    }
    return CalendarDate.fromEpochDay(utc.getTime() / millisecondsPerDay);
  }

  static fromEpochDay(epochDay: number): CalendarDate {
    if (!Number.isInteger(epochDay)) throw new ArgumentError(`Not a whole day: ${epochDay}`);
    let date = known.get(epochDay);
    if (date === undefined) {
      date = new CalendarDate(epochDay);
      known.set(epochDay, date);
    }
    return date;
  }

  /** The calendar day of `instant` where the device is. */
  static fromDate(instant: Date): CalendarDate {
    return CalendarDate.of(instant.getFullYear(), instant.getMonth() + 1, instant.getDate());
  }

  /** Parses `YYYY-MM-DD`. */
  static parse(iso: string): CalendarDate {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (match === null) throw new FormatError(`Expected YYYY-MM-DD: "${iso}"`);
    return CalendarDate.of(Number(match[1]), Number(match[2]), Number(match[3]));
  }

  private get utc(): Date {
    return new Date(this.epochDay * millisecondsPerDay);
  }

  get year(): number {
    return this.utc.getUTCFullYear();
  }

  /** January is 1. */
  get month(): number {
    return this.utc.getUTCMonth() + 1;
  }

  get day(): number {
    return this.utc.getUTCDate();
  }

  addDays(days: number): CalendarDate {
    return CalendarDate.fromEpochDay(this.epochDay + days);
  }

  /** Signed number of days from this date to `other`. */
  daysUntil(other: CalendarDate): number {
    return other.epochDay - this.epochDay;
  }

  isBefore(other: CalendarDate): boolean {
    return this.epochDay < other.epochDay;
  }

  isAfter(other: CalendarDate): boolean {
    return this.epochDay > other.epochDay;
  }

  /** Negative when this date is earlier, for sorting. */
  compareTo(other: CalendarDate): number {
    return this.epochDay - other.epochDay;
  }

  toString(): string {
    const two = (n: number) => String(n).padStart(2, '0');
    return `${String(this.year).padStart(4, '0')}-${two(this.month)}-${two(this.day)}`;
  }
}
