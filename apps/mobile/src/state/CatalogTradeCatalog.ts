import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodGroup } from '../domain/food/FoodGroup';
import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import type { TradeCatalog } from '../engine/analysis/TradeCatalog';
import type { TradeCatalogFood } from '../engine/analysis/TradeCatalogFood';
import type { TradeTarget } from '../engine/analysis/TradeTarget';
import { gradeMicrosFrom } from '../engine/gradeMicrosFrom';
import { gradeOfNutrition } from '../engine/gradeOfNutrition';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { CatalogFoodLookup } from '../foodCatalog/CatalogFoodLookup';
import type { CatalogSearch } from '../foodCatalog/CatalogSearch';
import type { CatalogServingLookup } from '../foodCatalog/CatalogServingLookup';

const originKey = (origin: Pick<FoodOrigin, 'packId' | 'foodId'>) => `${origin.packId}:${origin.foodId}`;

/**
 * The `TradeCatalog` over the installed packs (MM-607, MM-616), read ahead
 * of time so the engine's trade is answered at once: `load` finds the group
 * of each catalog food the entries were logged from, then lists the foods of
 * those groups, each at its default serving (the first the pack lists, or
 * 100 g). A group lists at most `perGroup` foods, in the order the packs
 * store them.
 */
export class CatalogTradeCatalog implements TradeCatalog {
  private readonly groups: ReadonlyMap<string, FoodGroup>;
  private readonly foods: ReadonlyMap<FoodGroup, readonly TradeCatalogFood[]>;

  private constructor(groups: ReadonlyMap<string, FoodGroup>, foods: ReadonlyMap<FoodGroup, readonly TradeCatalogFood[]>) {
    this.groups = groups;
    this.foods = foods;
  }

  static async load(
    catalog: CatalogSearch & CatalogFoodLookup & CatalogServingLookup,
    entries: readonly FoodEntry[],
    { perGroup = 500 }: { perGroup?: number } = {},
  ): Promise<CatalogTradeCatalog> {
    const groups = new Map<string, FoodGroup>();
    const looked = new Set<string>();
    for (const entry of entries) {
      const origin = entry.portion?.origin;
      if (origin === undefined || origin.packId === 'custom') continue;
      const key = originKey(origin);
      if (looked.has(key)) continue;
      looked.add(key);
      const group = (await catalog.foodById(origin.packId, origin.foodId))?.group;
      if (group !== undefined) groups.set(key, group);
    }
    const foods = new Map<FoodGroup, TradeCatalogFood[]>();
    for (const group of new Set(groups.values())) {
      const listed: TradeCatalogFood[] = [];
      for (const hit of await catalog.search('', { group, limit: perGroup })) {
        if (hit.food.group !== group || !(hit.food.kcal > 0)) continue;
        const grams = (await catalog.servingsOf(hit.food))[0]?.grams ?? 100;
        if (!(grams > 0)) continue;
        listed.push(tradeFoodOf(hit.food, group, grams));
      }
      foods.set(group, listed);
    }
    return new CatalogTradeCatalog(groups, foods);
  }

  groupOf(origin: Pick<FoodOrigin, 'packId' | 'foodId'>): FoodGroup | undefined {
    if (origin.packId === 'custom') return undefined;
    return this.groups.get(originKey(origin));
  }

  candidatesIn(group: FoodGroup, target: TradeTarget): readonly TradeCatalogFood[] {
    return (this.foods.get(group) ?? []).filter(
      (food) => food.kcal >= target.minKcal && (target.maxKcal === undefined || food.kcal <= target.maxKcal),
    );
  }
}

/** A pack food, stated per 100 g, at a serving of `grams`. */
function tradeFoodOf(food: CatalogFood, group: FoodGroup, grams: number): TradeCatalogFood {
  const scale = grams / 100;
  const scaled = (value: number | undefined) => (value === undefined ? undefined : value * scale);
  const grade = gradeOfNutrition({
    kcal: food.kcal,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fiberG: food.fiberG,
    sodiumMg: food.sodiumMg,
    sugarsG: food.micros.sugars,
    saturatedFatG: food.micros.saturatedFat,
    alcoholG: food.alcoholG,
    micros: gradeMicrosFrom((n) => food.micros[n]),
  });
  return {
    name: food.name,
    group,
    grams,
    kcal: food.kcal * scale,
    proteinG: food.proteinG * scale,
    carbsG: food.carbsG * scale,
    fatG: food.fatG * scale,
    sodiumMg: scaled(food.sodiumMg),
    fiberG: scaled(food.fiberG),
    alcoholG: scaled(food.alcoholG),
    grade: grade.kind === 'graded' ? grade.letter : undefined,
  };
}
