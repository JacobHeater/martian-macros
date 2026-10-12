/**
 * The rules of the weekly recovery check-in (MM-116). Judgement: tune them
 * here.
 */
export const RecoveryRule = {
  /** Days between check-ins, and how long a skip lasts. */
  everyDays: 7,

  /** How many of the latest check-ins are shown as lines. */
  shownCheckIns: 8,

  /** The lowest and highest answer. */
  lowest: 1,
  highest: 5,
} as const;
