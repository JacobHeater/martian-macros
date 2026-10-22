import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { ReminderKind } from '../domain/ReminderKind';
import { pauseOn } from './pauseOn';
import { RecoveryRule } from './RecoveryRule';
import { ReminderRule } from './ReminderRule';

interface ReminderFactsInit {
  weighInDays?: Iterable<CalendarDate>;
  foodDays?: Iterable<CalendarDate>;
  waistDays?: Iterable<CalendarDate>;
  /** The days the recovery check-in was answered or skipped (MM-116). */
  recoveryDays?: Iterable<CalendarDate>;
  /** The day setup was finished: the first recovery check-in is due a week later. */
  recoveryFrom?: CalendarDate | undefined;
  pauses?: readonly Pause[];
}

const epochDays = (days: Iterable<CalendarDate> | undefined) => new Set([...(days ?? [])].map((d) => d.epochDay));

/**
 * What the reminder rules need to know about what the user has done
 * (MM-146).
 */
export class ReminderFacts {
  private readonly weighIn: ReadonlySet<number>;
  private readonly food: ReadonlySet<number>;
  private readonly waist: ReadonlySet<number>;
  private readonly recovery: readonly number[];
  private readonly recoveryFrom: number | undefined;
  readonly pauses: readonly Pause[];

  constructor(init: ReminderFactsInit = {}) {
    this.weighIn = epochDays(init.weighInDays);
    this.food = epochDays(init.foodDays);
    this.waist = epochDays(init.waistDays);
    this.recovery = [...epochDays(init.recoveryDays)].sort((a, b) => a - b);
    this.recoveryFrom = init.recoveryFrom?.epochDay;
    this.pauses = init.pauses ?? [];
  }

  /**
   * Whether the thing `kind` asks for has been done as of `day`, so no
   * reminder is wanted that day.
   */
  done(kind: ReminderKind, day: CalendarDate): boolean {
    switch (kind) {
      case 'weighIn':
        return this.weighIn.has(day.epochDay);
      case 'logFood':
        return this.food.has(day.epochDay);
      case 'weeklyMeasurement':
        return [...this.waist].some(
          (d) => d <= day.epochDay && d > day.epochDay - ReminderRule.measurementEveryDays,
        );
      case 'recoveryCheckIn':
        return this.recovery.some((d) => d <= day.epochDay && d > day.epochDay - RecoveryRule.everyDays);
    }
  }

  /**
   * Whether the recovery check-in falls due on `day`: a whole number of
   * weeks after it was last answered or skipped, or after setup, and at
   * least one. So it is asked for once a week while it waits, on the
   * weekday it became due.
   */
  private recoveryFallsOn(day: CalendarDate): boolean {
    if (this.recoveryFrom === undefined) return false;
    let anchor = this.recoveryFrom;
    for (const d of this.recovery) {
      if (d <= day.epochDay && d > anchor) anchor = d;
    }
    const since = day.epochDay - anchor;
    return since >= RecoveryRule.everyDays && since % RecoveryRule.everyDays === 0;
  }

  /**
   * Whether `kind` could be sent on `day` at `minuteOfDay` at all: a day it
   * falls on, outside the quiet period, and not in a pause (MM-148).
   */
  sendable(kind: ReminderKind, day: CalendarDate, minuteOfDay: number): boolean {
    if (ReminderRule.isQuiet(minuteOfDay)) return false;
    if (pauseOn(this.pauses, day) !== undefined) return false;
    // The weekly measurement is asked for on Sundays. Day 0 was a Thursday.
    if (kind === 'weeklyMeasurement' && (day.epochDay + 4) % 7 !== 0) {
      return false;
    }
    if (kind === 'recoveryCheckIn' && !this.recoveryFallsOn(day)) return false;
    return true;
  }
}
