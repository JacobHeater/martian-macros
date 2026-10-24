import type { FoodGroup } from '../../domain/food/FoodGroup';
import type { FoodGradeLetter } from '../../domain/food/grade/FoodGradeLetter';

/**
 * A catalog food a trade may offer as Y (MM-607), at its default serving:
 * the first serving the pack lists, or 100 g when it lists none. Undefined
 * means not stated, never zero.
 */
export interface TradeCatalogFood {
  readonly name: string;
  readonly group: FoodGroup;
  /** What the default serving weighs. */
  readonly grams: number;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbsG: number;
  readonly fatG: number;
  readonly sodiumMg: number | undefined;
  readonly fiberG: number | undefined;
  readonly alcoholG: number | undefined;
  /** The food's grade (MM-380), or undefined when it can't be graded. */
  readonly grade: FoodGradeLetter | undefined;
}
