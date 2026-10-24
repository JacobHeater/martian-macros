import type { FoodGroup } from '../domain/food/FoodGroup';
import { categoryKey } from './categoryKey';
import { foodGroupTable } from './foodGroupTable';

/**
 * `foodGroupTable` by `categoryKey` (MM-616): a key that is present was
 * reviewed (its value `null` when the category has no group on purpose); a
 * key that is absent is an unmapped category.
 */
export const foodGroupByCategory: ReadonlyMap<string, FoodGroup | null> = new Map(
  foodGroupTable.flatMap(({ group, categories }) => categories.map((category) => [categoryKey(category), group] as const)),
);
