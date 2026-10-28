import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';

/**
 * The unified deterministic coaching pre-calculation for the Coach screen's
 * Executive Summary card (MM-663).
 *
 * Focuses strictly on energy balance, the anabolic protein floor, and
 * consistency, enforcing the hard mathematical invariant:
 * `proteinRemainingG * 4 <= kcalRemaining`.
 */
export interface ExecutiveBrief {
  readonly date: CalendarDate;
  /** Whether the protected eating-disorder or protein-only safeguard is active. */
  readonly protectedPath: boolean;
  /** The mutually exclusive intraday runway state. */
  readonly runwayState:
    | 'nothingLogged'
    | 'onTrack'
    | 'tightRunway'
    | 'proteinUnrecoverable'
    | 'overBudget'
    | 'targetsLocked';
  readonly kcalTarget: number;
  readonly kcalLogged: number;
  readonly kcalRemaining: number;
  readonly proteinTargetG: number;
  readonly proteinMinimumG: number;
  readonly proteinLoggedG: number;
  readonly proteinRemainingG: number;
  /** Required protein share of remaining calories (`(proteinRemainingG * 4) / kcalRemaining`), or 0 when none remain. */
  readonly requiredProteinDensity: number;
  /** The single primary meal or item driving calorie displacement today, when applicable. */
  readonly primaryDriver?:
    | {
        readonly meal: Meal;
        readonly mealName?: string | undefined;
        readonly foodName: string;
        readonly kcal: number;
        readonly proteinG: number;
        readonly fatG: number;
        readonly withoutKcalOver?: number | undefined;
        readonly replacement?:
          | {
              readonly name: string;
              readonly kcal?: number | undefined;
              readonly proteinG?: number | undefined;
              readonly caloriesSaved: number;
              readonly proteinGained: number;
            }
          | undefined;
      }
    | undefined;
  /** 7-day strategic accountability summary (energy balance, protein floor hits, consistency). */
  readonly sevenDay: {
    readonly loggedDays: number;
    readonly calorieAdherenceDays: number;
    readonly proteinFloorHitDays: number;
    readonly averageKcal: number;
    readonly averageProteinG: number;
    readonly weighIns: number;
  };
}
