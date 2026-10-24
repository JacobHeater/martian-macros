import type { FoodEntry } from '../../../domain/FoodEntry';
import { medianOf } from '../../trends/medianOf';
import type { CoachFood } from '../CoachFood';
import { countsAsFood } from './countsAsFood';
import { FoodSignalRule } from './FoodSignalRule';
import { foodKeyOf } from './foodKeyOf';

/**
 * N11, the top contributors (MM-606): up to 3 foods, each eaten on at least
 * `minimumDays` days and giving at least 15% of the total that `amountOf`
 * measures over `entries` (fat, sodium, calories, or the calories that
 * carried little protein for the targets), most first. None when the top
 * 3 foods explain less than 30% together: a diffuse pattern names no food.
 *
 * The total counts every entry, so a share is honest; only foods that may be
 * named are ranked (`countsAsFood`: no quick-add estimate, no drink mostly
 * of alcohol, macros explaining 75% of the calories). Entries of one name are
 * one food. A food's calories and protein are its median a time.
 */
export function topContributors(
  entries: readonly FoodEntry[],
  amountOf: (entry: FoodEntry) => number | undefined,
  {
    minimumDays = FoodSignalRule.contributorMinimumDays,
    minimumShare = FoodSignalRule.contributorShare,
  }: { minimumDays?: number; minimumShare?: number } = {},
): CoachFood[] {
  let total = 0;
  const foods = new Map<string, { name: string; amount: number; days: Set<number>; kcal: number[]; proteinG: number[] }>();
  for (const entry of entries) {
    const amount = amountOf(entry);
    if (amount === undefined || !(amount > 0)) continue;
    total += amount;
    if (!countsAsFood(entry)) continue;
    const key = foodKeyOf(entry);
    let food = foods.get(key);
    if (food === undefined) {
      food = { name: entry.name.trim(), amount: 0, days: new Set(), kcal: [], proteinG: [] };
      foods.set(key, food);
    }
    food.amount += amount;
    food.days.add(entry.date.epochDay);
    food.kcal.push(entry.kcal);
    food.proteinG.push(entry.proteinG);
  }
  if (!(total > 0)) return [];
  const ranked = [...foods.values()].sort((a, b) => b.amount - a.amount).slice(0, FoodSignalRule.contributorsMost);
  const explained = ranked.reduce((s, f) => s + f.amount, 0) / total;
  if (explained < FoodSignalRule.contributorsQuietShare) return [];
  return ranked
    .filter((f) => f.days.size >= minimumDays && f.amount / total >= minimumShare)
    .map((f) => ({
      name: f.name,
      share: f.amount / total,
      days: f.days.size,
      kcal: medianOf(f.kcal),
      proteinG: medianOf(f.proteinG),
    }));
}
