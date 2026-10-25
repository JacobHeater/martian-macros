import type { FoodGroup } from '../domain/food/FoodGroup';
import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import type { SwapNameIndex } from '../engine/analysis/swap/SwapNameIndex';
import { swapNameIndexOf } from '../engine/analysis/swap/swapNameIndexOf';
import type { TradeCatalog } from '../engine/analysis/TradeCatalog';
import type { TradeCatalogFood } from '../engine/analysis/TradeCatalogFood';
import type { TradeTarget } from '../engine/analysis/TradeTarget';

/**
 * A `TradeCatalog` over foods in memory (MM-607), each at its default
 * serving, found by its pack and id; each group's name index (MM-617) is
 * built when it is made.
 */
export class InMemoryTradeCatalog implements TradeCatalog {
  private readonly foods: readonly { readonly packId: string; readonly foodId: number; readonly food: TradeCatalogFood }[];
  private readonly indexes: ReadonlyMap<FoodGroup, SwapNameIndex>;

  constructor(foods: readonly { readonly packId: string; readonly foodId: number; readonly food: TradeCatalogFood }[]) {
    this.foods = foods;
    const byGroup = new Map<FoodGroup, TradeCatalogFood[]>();
    for (const { food } of foods) {
      if (!(food.kcal > 0)) continue;
      const listed = byGroup.get(food.group);
      if (listed === undefined) byGroup.set(food.group, [food]);
      else listed.push(food);
    }
    this.indexes = new Map([...byGroup].map(([group, listed]): [FoodGroup, SwapNameIndex] => [group, swapNameIndexOf(listed)]));
  }

  groupOf(origin: Pick<FoodOrigin, 'packId' | 'foodId'>): FoodGroup | undefined {
    if (origin.packId === 'custom') return undefined;
    return this.foods.find((f) => f.packId === origin.packId && f.foodId === origin.foodId)?.food.group;
  }

  candidatesIn(group: FoodGroup, target: TradeTarget): readonly TradeCatalogFood[] {
    return this.foods
      .map((f) => f.food)
      .filter(
        (food) =>
          food.group === group &&
          food.kcal > 0 &&
          food.kcal >= target.minKcal &&
          (target.maxKcal === undefined || food.kcal <= target.maxKcal),
      );
  }

  nameIndexIn(group: FoodGroup): SwapNameIndex {
    return this.indexes.get(group) ?? swapNameIndexOf([]);
  }
}
