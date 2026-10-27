import type { FoodEntry } from '../domain/FoodEntry';
import type { FoodGroup } from '../domain/food/FoodGroup';
import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import type { TradeCatalog } from '../engine/analysis/TradeCatalog';
import type { SwapNameIndex } from '../engine/analysis/swap/SwapNameIndex';
import { swapNameIndexOf } from '../engine/analysis/swap/swapNameIndexOf';
import type { TradeCatalogFood } from '../engine/analysis/TradeCatalogFood';
import type { TradeTarget } from '../engine/analysis/TradeTarget';
import { gradeMicrosFrom } from '../engine/gradeMicrosFrom';
import { gradeOfNutrition } from '../engine/gradeOfNutrition';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { CatalogServing } from '../foodCatalog/CatalogServing';
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
 * store them. Each group's name index for the swap (MM-617) is built there
 * too, over the same foods, so a swap never reads the catalog.
 */
export class CatalogTradeCatalog implements TradeCatalog {
  private readonly groups: ReadonlyMap<string, FoodGroup>;
  private readonly foods: ReadonlyMap<FoodGroup, readonly TradeCatalogFood[]>;
  private readonly indexes: ReadonlyMap<FoodGroup, SwapNameIndex>;

  private constructor(groups: ReadonlyMap<string, FoodGroup>, foods: ReadonlyMap<FoodGroup, readonly TradeCatalogFood[]>) {
    this.groups = groups;
    this.foods = foods;
    this.indexes = new Map([...foods].map(([group, listed]): [FoodGroup, SwapNameIndex] => [group, swapNameIndexOf(listed)]));
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
        const amount = tradeAmountOf(hit.food, (await catalog.servingsOf(hit.food))[0]);
        if (amount === undefined) continue;
        listed.push(tradeFoodOf(hit.food, group, amount));
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

  nameIndexIn(group: FoodGroup): SwapNameIndex {
    return this.indexes.get(group) ?? swapNameIndexOf([]);
  }
}

/**
 * The amount a trade says a pack food at (MM-650): its first serving, or 100
 * of its basis, as grams and as a multiple of that basis. A food stated per
 * 100 mL is taken only through a density, since a trade is said in grams and
 * nothing is guessed.
 */
function tradeAmountOf(food: CatalogFood, serving: CatalogServing | undefined): { grams: number; scale: number } | undefined {
  if (food.basis === 'per100g') {
    const grams = serving?.grams ?? 100;
    return grams > 0 ? { grams, scale: grams / 100 } : undefined;
  }
  const density = food.densityGPerMl;
  if (density === undefined || !(density > 0)) return undefined;
  const ml = serving?.milliliters ?? (serving?.grams === undefined ? 100 : serving.grams / density);
  return ml > 0 ? { grams: ml * density, scale: ml / 100 } : undefined;
}

/** A pack food at `amount`: its first serving, or 100 of its basis. */
function tradeFoodOf(food: CatalogFood, group: FoodGroup, { grams, scale }: { grams: number; scale: number }): TradeCatalogFood {
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
