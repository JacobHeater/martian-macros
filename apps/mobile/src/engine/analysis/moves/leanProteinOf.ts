import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import { foodKeyOf } from '../food/foodKeyOf';
import { isSameFoodName } from '../food/isSameFoodName';
import { readableFood } from '../swap/readableFood';
import type { TradeCatalog } from '../TradeCatalog';
import { TradeRule } from '../TradeRule';
import { everydayProteinRankOf } from './everydayProteinRankOf';
import type { MoveFood } from './MoveFood';
import { MoveRule } from './MoveRule';
import { proteinGroups } from './proteinGroups';

/** A candidate's figures a time. */
interface Figures {
  readonly kcal: number;
  readonly proteinG: number;
}

const lean = (food: Figures) => food.kcal > 0 && (food.proteinG * 4) / food.kcal >= MoveRule.leanProteinShare;

/**
 * The lean protein food that closes the most of the protein gap inside
 * `maxKcal` (MM-684): the catalog first (the owner, 2026-10-28), from the
 * everyday proteins only (MM-688), the first on that list the catalog
 * holds a fitting serving of, at each food's default serving; then the
 * person's own foods logged at `meal` on `TradeRule.loggedMinDays` days,
 * at their median portion. Never a food on the plate, under any spelling,
 * nor one snoozed. Among the same everyday food, and among the person's
 * own, the most protein wins, then the fewer calories, then the name.
 * Undefined when nothing fits.
 */
export function leanProteinOf(input: {
  readonly catalog: TradeCatalog | undefined;
  readonly history: readonly FoodEntry[];
  readonly meal: Meal;
  readonly plate: readonly FoodEntry[];
  readonly maxKcal: number;
  readonly snoozed?: ReadonlySet<string> | undefined;
}): MoveFood | undefined {
  if (!(input.maxKcal > 0)) return undefined;
  const barred = (name: string) =>
    input.plate.some((plated) => isSameFoodName(plated.name, name)) || (input.snoozed?.has(name.trim().toLowerCase()) ?? false);
  const better = (a: MoveFood, b: MoveFood) => b.proteinG - a.proteinG || a.kcal - b.kcal || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

  if (input.catalog !== undefined) {
    const found: { readonly rank: number; readonly food: MoveFood }[] = [];
    for (const group of proteinGroups) {
      for (const food of input.catalog.candidatesIn(group, { minKcal: 1, maxKcal: input.maxKcal })) {
        if (!readableFood(food) || !lean(food) || barred(food.name)) continue;
        const rank = everydayProteinRankOf(food);
        if (rank === undefined) continue;
        found.push({ rank, food: { name: food.name, kcal: food.kcal, proteinG: food.proteinG, fatG: food.fatG, source: 'catalog' } });
      }
    }
    found.sort((a, b) => a.rank - b.rank || better(a.food, b.food));
    if (found[0] !== undefined) return found[0].food;
  }

  const byKey = new Map<string, FoodEntry[]>();
  for (const entry of input.history) {
    if (entry.meal !== input.meal) continue;
    const list = byKey.get(foodKeyOf(entry));
    if (list === undefined) byKey.set(foodKeyOf(entry), [entry]);
    else list.push(entry);
  }
  const own: MoveFood[] = [];
  for (const entries of byKey.values()) {
    const days = new Set(entries.map((e) => e.date.epochDay)).size;
    if (days < TradeRule.loggedMinDays) continue;
    const sorted = (of: (e: FoodEntry) => number) => entries.map(of).sort((a, b) => a - b);
    const median = (values: number[]) => values[Math.floor(values.length / 2)] ?? 0;
    const food = { kcal: median(sorted((e) => e.kcal)), proteinG: median(sorted((e) => e.proteinG)), fatG: median(sorted((e) => e.fatG)) };
    const name = entries[0]!.name.trim();
    if (!(food.kcal > 0) || food.kcal > input.maxKcal || !lean(food) || barred(name)) continue;
    own.push({ name, ...food, source: 'own' });
  }
  own.sort(better);
  return own[0];
}
