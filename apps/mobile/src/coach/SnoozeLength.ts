import type { CalendarDate } from '../domain/CalendarDate';

const values = ['day', 'week', 'month', 'always'] as const;

/** How long an inline insight is snoozed for on an item (MM-378). */
export type SnoozeLength = (typeof values)[number];

const days: Readonly<Record<SnoozeLength, number | undefined>> = { day: 1, week: 7, month: 30, always: undefined };

export const SnoozeLength = {
  values,

  /** As the choice is offered. */
  label(length: SnoozeLength): string {
    return { day: 'For a day', week: 'For a week', month: 'For a month', always: 'Until I turn it back on' }[length];
  },

  /**
   * The first day the insight shows again, snoozed on `today`: the whole of
   * the length's days after today stay quiet, so a day's snooze made in the
   * evening is quiet all of tomorrow. Undefined for always.
   */
  resumesOn(length: SnoozeLength, today: CalendarDate): CalendarDate | undefined {
    const n = days[length];
    return n === undefined ? undefined : today.addDays(n + 1);
  },
} as const;
