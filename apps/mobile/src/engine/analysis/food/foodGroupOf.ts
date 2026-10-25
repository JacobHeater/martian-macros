import type { FoodGroup } from '../../../domain/food/FoodGroup';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { TradeCatalog } from '../TradeCatalog';
import { foodKeyOf } from './foodKeyOf';

/** A food's group (MM-616), from the catalog food any of its entries was logged from; undefined when none was. */
export function foodGroupOf(key: string, entries: readonly FoodEntry[], catalog: TradeCatalog | undefined): FoodGroup | undefined {
  if (catalog === undefined) return undefined;
  for (const e of entries) {
    const origin = e.portion?.origin;
    if (origin === undefined || foodKeyOf(e) !== key) continue;
    const group = catalog.groupOf(origin);
    if (group !== undefined) return group;
  }
  return undefined;
}
