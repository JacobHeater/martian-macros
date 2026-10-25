import type { Caution } from '../../../domain/Caution';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { GoalMode } from '../../../domain/GoalMode';
import type { Meal } from '../../../domain/Meal';
import type { FoodGroup } from '../../../domain/food/FoodGroup';
import type { InsightSafeguards } from '../../InsightSafeguards';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import type { TradeCatalog } from '../TradeCatalog';

/** What `swapFor` needs to find what goes in a food's place (MM-617). */
export interface SwapInput {
  /** The food to replace, at the portion eaten, with its carbohydrate and sodium where known. */
  readonly food: CoachAdviceFood & { readonly carbsG?: number | undefined };
  /** Its group, when it came from the catalog (MM-616). */
  readonly group?: FoodGroup | undefined;
  /** The meal it was eaten at. */
  readonly meal?: Meal | undefined;
  readonly goal: GoalMode;
  /** The person's foods of the last 56 days: their own foods come first. */
  readonly history: readonly FoodEntry[];
  /** The catalog, once read; undefined until then. */
  readonly catalog: TradeCatalog | undefined;
  readonly safeguards: InsightSafeguards;
  readonly cautions: ReadonlySet<Caution>;
}
