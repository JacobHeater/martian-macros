import type { ReminderKind } from '../domain/ReminderKind';

const quietFromMinute = 21 * 60;
const quietToMinute = 7 * 60;

const defaultMinutes: Record<ReminderKind, number> = {
  weighIn: 7 * 60,
  logFood: 20 * 60,
  weeklyMeasurement: 8 * 60,
};

/** The rules reminders obey (MM-146). Judgement: tune them here. */
export const ReminderRule = {
  /** A reminder sent this many times running with no matching action stops. */
  ignoredLimit: 7,

  /** The most notifications in one day, whatever is turned on. */
  dailyCap: 2,

  /**
   * Nothing is sent from `quietFromMinute` until `quietToMinute` the next
   * morning (9 pm to 7 am).
   */
  quietFromMinute,
  quietToMinute,

  /** The waist counts as measured for this many days. */
  measurementEveryDays: 7,

  /**
   * The most reminders planned at once: iOS keeps only the soonest 64
   * pending local notifications and drops the rest without a word (MM-405).
   */
  mostPending: 64,

  /** How far ahead reminders are planned. Long enough for seven weekly ones. */
  horizonDays: 49,

  /** When each reminder is sent until the user chooses a time. */
  defaultMinuteOfDay(kind: ReminderKind): number {
    return defaultMinutes[kind];
  },

  /** Whether `minuteOfDay` falls in the quiet period. */
  isQuiet(minuteOfDay: number): boolean {
    return minuteOfDay >= quietFromMinute || minuteOfDay < quietToMinute;
  },
} as const;
