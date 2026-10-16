import type { CalendarDate } from './CalendarDate';

/**
 * The goals the user set in Settings (MM-311, MM-313). The sodium limit is
 * undefined while switched off, which is how a new installation starts. The
 * water goal is on unless switched off (MM-358): an amount the person typed,
 * or, while there is none, the one suggested for them.
 */
export class NutritionGoals {
  /** Suggested when the sodium limit is first switched on: the DGA's CDRR for adults. */
  static readonly suggestedSodiumLimitMg = 2_300;
  /** The Adequate Intake: a lower limit belongs to a clinician (owner, 2026-10-14; the panel's SA-7). */
  static readonly minSodiumLimitMg = 1_500;
  static readonly maxSodiumLimitMg = 6_000;

  static readonly minWaterGoalMl = 500;
  static readonly maxWaterGoalMl = 6_000;

  /** Above this a goal is said to be more than most people need (owner, 2026-10-14; the panel's SA-5). */
  static readonly highWaterGoalMl = 4_000;

  static readonly none = new NutritionGoals({});

  /** A daily upper limit, in milligrams. */
  readonly sodiumLimitMg: number | undefined;

  /**
   * The day the limit was last set, so a pattern over it starts there and a
   * changed limit never reaches back (MM-312, the panel's CO-4).
   */
  readonly sodiumLimitSince: CalendarDate | undefined;

  /** A daily amount to drink the person typed, in millilitres; undefined while the suggestion is used. */
  readonly waterGoalMl: number | undefined;

  /** The person switched the water goal off (MM-358). */
  readonly waterGoalOff: boolean;

  constructor(init: {
    sodiumLimitMg?: number | undefined;
    sodiumLimitSince?: CalendarDate | undefined;
    waterGoalMl?: number | undefined;
    waterGoalOff?: boolean | undefined;
  }) {
    this.sodiumLimitMg = init.sodiumLimitMg;
    this.sodiumLimitSince = init.sodiumLimitMg === undefined ? undefined : init.sodiumLimitSince;
    this.waterGoalMl = init.waterGoalMl;
    this.waterGoalOff = init.waterGoalOff ?? false;
  }

  static sodiumLimitAllowed(mg: number): boolean {
    return Number.isInteger(mg) && mg >= NutritionGoals.minSodiumLimitMg && mg <= NutritionGoals.maxSodiumLimitMg;
  }

  static waterGoalAllowed(ml: number): boolean {
    return ml >= NutritionGoals.minWaterGoalMl && ml <= NutritionGoals.maxWaterGoalMl;
  }
}
