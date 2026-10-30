import type { FoodEntry } from '../domain/FoodEntry';
import type { CustomFood } from '../domain/food/custom/CustomFood';
import type { FoodGroup } from '../domain/food/FoodGroup';
import type { FoodOrigin } from '../domain/food/portion/FoodOrigin';
import type { TradeCatalog } from '../engine/analysis/TradeCatalog';
import type { SwapNameIndex } from '../engine/analysis/swap/SwapNameIndex';
import { swapNameIndexOf } from '../engine/analysis/swap/swapNameIndexOf';
import type { TradeCatalogFood } from '../engine/analysis/TradeCatalogFood';
import type { TradeTarget } from '../engine/analysis/TradeTarget';
import { everydayProteinRankOf } from '../engine/analysis/moves/everydayProteinRankOf';
import { everydayProteins } from '../engine/analysis/moves/everydayProteins';
import { proteinGroups } from '../engine/analysis/moves/proteinGroups';
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
 * too, over the same foods, so a swap never reads the catalog. A saved
 * food with a group (MM-710) answers `groupOf` by that group, so the
 * coach's same-group swap may offer it or stand in its place. The
 * everyday proteins (MM-688) are searched by name on top, each at most
 * `perEveryday` foods, so chicken breast is listed however deep in its
 * group the pack stores it.
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
    { perGroup = 500, perEveryday = 40, savedFoods = [] }: { perGroup?: number; perEveryday?: number; savedFoods?: readonly CustomFood[] } = {},
  ): Promise<CatalogTradeCatalog> {
    const groups = new Map<string, FoodGroup>();
    // A saved food with a group (MM-710) is of that group wherever it was logged, so the coach may trade it within it.
    for (const saved of savedFoods) {
      if (saved.group !== undefined) groups.set(originKey({ packId: 'custom', foodId: saved.id }), saved.group);
    }
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
    const listedIds = new Map<FoodGroup, Set<string>>();
    const list = async (group: FoodGroup, hits: readonly { readonly food: CatalogFood }[], keep: (food: CatalogFood) => boolean) => {
      const listed = foods.get(group) ?? [];
      const ids = listedIds.get(group) ?? new Set<string>();
      for (const hit of hits) {
        const id = `${hit.food.packId}:${hit.food.id}`;
        if (hit.food.group !== group || !(hit.food.kcal > 0) || ids.has(id) || !keep(hit.food)) continue;
        const amount = tradeAmountOf(hit.food, (await catalog.servingsOf(hit.food))[0]);
        if (amount === undefined) continue;
        ids.add(id);
        listed.push(tradeFoodOf(hit.food, group, amount));
      }
      foods.set(group, listed);
      listedIds.set(group, ids);
    };
    // The protein groups are read whether or not the person logged from them: a lean protein food to add or to
    // carry the next meal comes from the catalog first (MM-684).
    for (const group of new Set([...groups.values(), ...proteinGroups])) {
      await list(group, await catalog.search('', { group, limit: perGroup }), () => true);
    }
    // The everyday proteins by name (MM-688): a group lists its first `perGroup` foods as the pack stores them, and
    // chicken breast stands past a thousand beef cuts and game; the owner's brief of 2026-10-28 named a beaver.
    for (const protein of everydayProteins) {
      const hits = await catalog.search(protein.query, { group: protein.group, limit: perEveryday });
      await list(protein.group, hits, (food) => everydayProteinRankOf({ name: food.name, group: protein.group }) !== undefined);
    }
    return new CatalogTradeCatalog(groups, foods);
  }

  groupOf(origin: Pick<FoodOrigin, 'packId' | 'foodId'>): FoodGroup | undefined {
    // A saved food is of the group it was given (MM-710), and of none otherwise.
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
