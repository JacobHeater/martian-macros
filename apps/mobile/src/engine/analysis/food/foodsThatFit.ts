import type { FoodEntry } from '../../../domain/FoodEntry';
import { FoodInsightRule } from '../../FoodInsightRule';
import { medianOf } from '../../trends/medianOf';
import type { CoachFood } from '../CoachFood';
import { countsAsFood } from './countsAsFood';
import { FoodSignalRule } from './FoodSignalRule';
import { foodKeyOf } from './foodKeyOf';

const R = FoodSignalRule;

/**
 * One or two foods the person logs that fit what is left today (MM-612):
 * at their usual portion (the median of their logged times), within the
 * calories left, with at least 10 g of protein and a fifth of their energy
 * from it. A meal logged as one (MM-587) counts as one food under its name;
 * a food counts on its own otherwise. Each must have been logged on at least
 * 2 days of `history`. Most protein first; never an estimate or a drink
 * mostly of alcohol.
 */
export function foodsThatFit(history: readonly FoodEntry[], proteinLeftG: number, kcalLeft: number): CoachFood[] {
  if (!(proteinLeftG > 0) || !(kcalLeft > 0) || proteinLeftG * 4 > kcalLeft) return [];
  // Each time a food or a meal was eaten: its calories and protein, and how much of it can be read.
  const times = new Map<string, { name: string; days: Set<number>; at: Map<string, { kcal: number; proteinG: number; countable: number }> }>();
  for (const e of history) {
    const meal = e.loggedMeal;
    const key = meal === undefined ? `food:${foodKeyOf(e)}` : `meal:${meal.name.trim().toLowerCase()}`;
    const instance = meal === undefined ? `${e.date.epochDay}:${e.id}:${e.meal}` : `${e.date.epochDay}:${meal.key}`;
    let unit = times.get(key);
    if (unit === undefined) {
      unit = { name: (meal?.name ?? e.name).trim(), days: new Set(), at: new Map() };
      times.set(key, unit);
    }
    unit.days.add(e.date.epochDay);
    const time = unit.at.get(instance) ?? { kcal: 0, proteinG: 0, countable: 0 };
    unit.at.set(instance, {
      kcal: time.kcal + e.kcal,
      proteinG: time.proteinG + e.proteinG,
      countable: time.countable + (countsAsFood(e) ? e.kcal : 0),
    });
  }
  const fitting: CoachFood[] = [];
  for (const unit of times.values()) {
    const readable = [...unit.at.values()].filter((t) => t.kcal > 0 && t.countable >= FoodInsightRule.knownMacrosShare * t.kcal);
    if (unit.days.size < R.fitsMinimumDays || readable.length === 0) continue;
    const kcal = medianOf(readable.map((t) => t.kcal));
    const proteinG = medianOf(readable.map((t) => t.proteinG));
    if (kcal > kcalLeft || proteinG < R.fitsMinimumProteinG || (100 * proteinG) / kcal < R.fitsMinimumProteinPer100Kcal) continue;
    fitting.push({ name: unit.name, share: Math.min(1, proteinG / proteinLeftG), days: unit.days.size, kcal, proteinG });
  }
  return fitting.sort((a, b) => (b.proteinG ?? 0) - (a.proteinG ?? 0) || a.kcal - b.kcal).slice(0, R.fitsMost);
}
