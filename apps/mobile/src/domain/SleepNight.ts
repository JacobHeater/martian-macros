import type { CalendarDate } from './CalendarDate';
import type { SleepSource } from './SleepSource';

interface SleepNightInit {
  date: CalendarDate;
  minutesAsleep: number;
  source: SleepSource;
  sourceName?: string | undefined;
}

/**
 * One night of sleep (MM-250): the minutes asleep, kept against the calendar
 * day the night ended on, so "last night" on a Tuesday is the Monday-to-Tuesday
 * sleep. Hours only: no score, no stages, no quality number.
 */
export class SleepNight {
  /** No night is outside these; a value that is was mistyped. */
  static readonly minMinutes = 1;
  static readonly maxMinutes = 24 * 60;

  /** The day the night ended on. */
  readonly date: CalendarDate;
  readonly minutesAsleep: number;
  readonly source: SleepSource;

  /** The app or device that recorded an imported night, as the platform names it; undefined for a typed night or an unnamed source. */
  readonly sourceName: string | undefined;

  constructor(init: SleepNightInit) {
    this.date = init.date;
    this.minutesAsleep = init.minutesAsleep;
    this.source = init.source;
    this.sourceName = init.sourceName;
  }

  /** Whether the day, the minutes and the source are the same. */
  equals(other: SleepNight): boolean {
    return (
      other.date === this.date &&
      other.minutesAsleep === this.minutesAsleep &&
      other.source === this.source &&
      other.sourceName === this.sourceName
    );
  }
}
