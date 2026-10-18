import type { CalendarDate } from '../domain/CalendarDate';

/**
 * One kind of inline insight quieted on one item (MM-378): the kind, the
 * item it is quiet on (`subject`, a food's name or an exercise's id), what
 * that item is called, and the first day it shows again; none for always.
 */
export interface InsightSnooze {
  readonly kind: string;
  readonly subject: string;
  readonly item: string;
  readonly resumesOn: CalendarDate | undefined;
}

export const InsightSnooze = {
  /** One string per kind and item, to key maps by. */
  key(kind: string, subject: string): string {
    return `${kind}\u0000${subject}`;
  },

  /** Whether `snooze` keeps its insight quiet on `today`. */
  quietOn(snooze: InsightSnooze, today: CalendarDate): boolean {
    return snooze.resumesOn === undefined || today.isBefore(snooze.resumesOn);
  },
} as const;
