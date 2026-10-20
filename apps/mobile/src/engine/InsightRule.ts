import type { InsightPriority } from './InsightPriority';

const rules = {
  /** The log is thin in a way that limits the coach: many partial days. */
  partialDays: { priority: 'dataQuality', aboutWeight: false, otherIntake: false },
  /** More than half the calories come from estimated entries (MM-150). */
  estimatesRising: { priority: 'dataQuality', aboutWeight: false, otherIntake: false },
  /** Fewer than four weigh-ins a week. */
  weighInTiming: { priority: 'dataQuality', aboutWeight: true, otherIntake: false },
  /** Progress has stalled, with its diagnosis (MM-140). */
  stall: { priority: 'coaching', aboutWeight: true, otherIntake: false },
  /** The protein minimum is met on fewer than half of whole days (MM-121). */
  proteinShort: { priority: 'pattern', aboutWeight: false, otherIntake: false },
  /**
   * Known sodium over the limit the user set on more than half of the days
   * that can be judged (MM-312). After protein: the limit is opt-in.
   */
  sodiumOverLimit: { priority: 'pattern', aboutWeight: false, otherIntake: true },
  /**
   * On days the protein minimum is missed, one meal has almost none
   * (MM-125). Advice about reaching the total, not about timing.
   */
  proteinByMeal: { priority: 'education', aboutWeight: false, otherIntake: false },
  // The three below came later (2026-10-19) and sit after the panel-ordered rules above; sorting is by priority first.
  /**
   * Weekend days average a fifth of the target or more above weekdays
   * (MM-141), from the same whole days the adherence summary uses.
   */
  weekendHigher: { priority: 'pattern', aboutWeight: false, otherIntake: true },
  /**
   * The waist is down beyond its noise while the trend weight held, in any
   * goal (MM-141; the recomp signal's cousin, MM-32).
   */
  waistAgainstWeight: { priority: 'pattern', aboutWeight: true, otherIntake: false },
  /**
   * One weekday was the highest, or the unlogged, day in both of the last
   * two weeks (MM-141). Stated, with no action.
   */
  consistentDay: { priority: 'pattern', aboutWeight: false, otherIntake: true },
  /**
   * Sleep averaged under six hours over the last fourteen recorded nights
   * (MM-252): what the evidence says, in one sentence, and the gentler pace
   * on offer. Rationed like the rest, so at most once a fortnight.
   */
  shortSleep: { priority: 'coaching', aboutWeight: false, otherIntake: false },
} as const satisfies Record<string, { priority: InsightPriority; aboutWeight: boolean; otherIntake: boolean }>;

/**
 * The catalog of insight rules (MM-141). Every insight comes from one of
 * these; there is no text generated at run time.
 */
export type InsightRule = keyof typeof rules;

export const InsightRule = {
  values: Object.keys(rules) as readonly InsightRule[],

  priority(rule: InsightRule): InsightPriority {
    return rules[rule].priority;
  },

  /** Suppressed entirely for a user with an eating-disorder history. */
  aboutWeight(rule: InsightRule): boolean {
    return rules[rule].aboutWeight;
  },

  /**
   * About intake other than protein and logging, so suppressed for a user
   * with an eating-disorder history (MM-141; the panel's CO-1).
   */
  otherIntake(rule: InsightRule): boolean {
    return rules[rule].otherIntake;
  },

  /** The place of a rule in the catalog: 0 is first. */
  index(rule: InsightRule): number {
    return (Object.keys(rules) as InsightRule[]).indexOf(rule);
  },
} as const;
