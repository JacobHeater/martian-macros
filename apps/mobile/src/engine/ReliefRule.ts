import { SleepRule } from './SleepRule';

/**
 * The thresholds of the offer to ease a deficit (MM-117). Judgement: none
 * has a trial behind it. Tune them here.
 */
export const ReliefRule = {
  /** An answer at or below this is at the hard end. */
  hardAnswer: 2,

  /**
   * A check-in counts as hard when at least this many of its five answers
   * are at the hard end.
   */
  hardAnswersPerCheckIn: 3,

  /** How many check-ins running must be hard. */
  hardCheckInsRunning: 2,

  /**
   * The latest check-in must be this recent, and the one before it no more
   * than this many days earlier than twice that.
   */
  freshDays: 7,
  consecutiveWithinDays: 14,

  /**
   * Two check-ins closer together than this are the same week answered
   * twice, not two weeks.
   */
  apartDays: 5,

  /** After the offer is answered it is not made again for this long. */
  quietDays: 21,

  /**
   * From this many weeks of unbroken deficit the coach would take the
   * maintenance week; before it, the slower pace.
   */
  breakFromDeficitWeeks: 8,

  /** Sleep below this is short: a signal of its own from the record (MM-252), a line when only typed at the check-in. */
  shortSleepHours: SleepRule.shortSleepHours,

  /**
   * The paces a fat-loss goal can run at, fastest first, as a fraction of
   * body weight a week (MM-128).
   */
  paces: [0.01, 0.0075, 0.005],

  /** The pace used when none was chosen. */
  defaultPace: 0.0075,
} as const;
