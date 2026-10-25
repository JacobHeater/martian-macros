/**
 * The figures of the coach's accountability (MM-617), chosen without asking
 * where the ticket gives none. Tune them here; each has an evidence row
 * (`docs/evidence.md`).
 */
export const CoachFollowUpRule = {
  /** A food told to skip or swap is followed up when eaten again within this many days of the order; the record is read this far back. */
  saidBeforeDays: 14,
  /** The day an order was given is said by its weekday within this many days, and by its date after. */
  weekdayWithinDays: 6,
  /** A day over its target by this many calories or more is counted as a repeat. */
  repeatOverKcal: 500,
  /** Days this calendar week (Monday first) over by `repeatOverKcal`, today among them, said from this many. */
  repeatOverMinDays: 2,
  /** A food or meal is named as what drove the repeats when it drove this many of the days. */
  repeatDriverMinDays: 2,
  /** Fat over its target and protein short are counted over this many days. */
  repeatWindowDays: 7,
  /** …and said at this many days of them or more. */
  repeatMinDays: 3,
  /** Advice taken: the food's old rate is read over this many days before the advice… */
  takenBeforeDays: 14,
  /** …on at least this many of which it was eaten… */
  takenBeforeMinDays: 3,
  /** …and it has not been eaten on this many whole days running since. */
  takenSinceMinDays: 3,
} as const;
