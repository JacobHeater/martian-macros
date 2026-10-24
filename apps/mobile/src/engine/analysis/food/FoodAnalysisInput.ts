import type { CalendarDate } from '../../../domain/CalendarDate';
import type { CarbFatBalance } from '../../../domain/CarbFatBalance';
import type { DayKind } from '../../../domain/DayKind';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { IntakeDay } from '../../../domain/IntakeDay';
import type { FiberPattern } from '../../FiberPattern';
import type { InsightSafeguards } from '../../InsightSafeguards';
import type { TargetsRecord } from '../../TargetsRecord';
import type { TradeCatalog } from '../TradeCatalog';

/**
 * What the food analysis reads (MM-606, MM-612), each part as `AppState`
 * holds it. Nothing here is stored or read from a clock.
 */
export interface FoodAnalysisInput {
  /**
   * The food entries the analysis may read: the span, the 28 days before it
   * (the trend engine's baselines), the last 56 days (trades and the foods
   * that fit what is left), and today for 1d.
   */
  readonly entries: readonly FoodEntry[];

  /** Each logged day's totals (MM-27), with its completeness, estimates and logging style, over the same days. */
  readonly intake: readonly IntakeDay[];

  /** Every targets record: each day is read against the one in force that day. */
  readonly history: readonly TargetsRecord[];

  readonly safeguards: InsightSafeguards;

  /** The days marked a Refeed or a Day off (MM-611), by epoch day (`AppState.markedDays`). */
  readonly markedDays: ReadonlyMap<number, DayKind>;

  /** The share of the flat calorie target planned for each day (MM-124); every day flat without it. */
  readonly plannedShare?: ((date: CalendarDate) => number) | undefined;

  /** The fat minimum at a calorie level (`SafetyBounds.minFatG` for the person); without it fat under the minimum is not read. */
  readonly fatMinimumG?: ((kcal: number) => number) | undefined;

  /** The carb and fat balance the person chose (MM-122); the carbohydrate floor (N7) is read only while one keeps it. */
  readonly balance?: CarbFatBalance | undefined;

  /** Body weight in kg, for the protein a main meal carries (N3's holding up). Never shown. */
  readonly weightKg?: number | undefined;

  /** Who the fiber guide is for and the recovery check-ins (MM-126); absent below Full detail, where fiber is not shown. */
  readonly fiber?: Omit<FiberPattern, 'days'> | undefined;

  /** The sodium limit and the day it was set (MM-312); absent when no limit is set. */
  readonly sodium?: { readonly limitMg: number; readonly since: CalendarDate } | undefined;

  /** The catalog by food group, for a trade's catalog Y (MM-607, MM-616); undefined when no pack is installed. */
  readonly catalog?: TradeCatalog | undefined;

  /** The day's calorie floor (`SafetyBounds.calorieFloorKcal`): no trade takes a span under it. */
  readonly calorieFloorKcal?: number | undefined;

  /** Foods the person snoozed (MM-378), by name in lower case: never named in a trade. */
  readonly snoozed?: ReadonlySet<string> | undefined;
}
