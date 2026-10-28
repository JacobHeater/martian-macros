import type { Caution } from '../../../domain/Caution';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { GoalMode } from '../../../domain/GoalMode';
import type { Meal } from '../../../domain/Meal';
import type { InsightSafeguards } from '../../InsightSafeguards';
import type { TradeCatalog } from '../TradeCatalog';

/** What a meal's moves are computed from (MM-684). */
export interface MealMovesInput {
  readonly meal: Meal;
  readonly mealEntries: readonly FoodEntry[];
  readonly dayEntries: readonly FoodEntry[];
  readonly dailyKcalTarget: number;
  readonly dailyProteinTargetG: number;
  readonly goal: GoalMode;
  /** The person's foods of the last 56 days, for their own candidates. */
  readonly history: readonly FoodEntry[];
  /** The catalog, once read; undefined until then or with no pack. */
  readonly catalog: TradeCatalog | undefined;
  readonly safeguards: InsightSafeguards;
  readonly cautions: ReadonlySet<Caution>;
  /** Foods the person snoozed (MM-378), by name in lower case: never named. */
  readonly snoozed?: ReadonlySet<string> | undefined;
}
