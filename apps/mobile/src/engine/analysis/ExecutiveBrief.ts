import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';
import type { MealMove } from './moves/MealMove';
import type { TrainingBrief } from './TrainingBrief';

/**
 * The unified deterministic coaching pre-calculation for the Coach screen's
 * Executive Summary card (MM-663).
 *
 * Energy balance, the anabolic protein floor and consistency, enforcing the
 * hard mathematical invariant `proteinRemainingG * 4 <= kcalRemaining`; and,
 * since MM-681, what the person is held to in training, cardio and steps
 * (`training`), absent only under the safeguards that forbid it.
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
  /** True when `runwayState === 'proteinUnrecoverable'`. */
  readonly proteinUnrecoverable: boolean;
  /** The latest of breakfast, lunch and dinner with food logged today (MM-711); none when only snacks are, or nothing. */
  readonly lastMeal?: Meal | undefined;
  /** Stable cache hash of the pre-calculated brief inputs and state. */
  readonly briefHash: string;
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
        /** The meal's own fix for next time (MM-684): a same-group swap, a protein food added, or a cut; none when nothing qualifies. */
        readonly move?: MealMove | undefined;
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
  /** Lifting, cardio and steps this week against what the person is held to (MM-681); absent under the safeguards. */
  readonly training?: TrainingBrief | undefined;
}
