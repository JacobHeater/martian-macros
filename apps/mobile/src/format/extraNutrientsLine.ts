import type { FoodEntry } from '../domain';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/**
 * Fiber, sugar alcohols, the other carbohydrate figure, sugars, saturated
 * fat, sodium and alcohol for Full detail (MM-49), only the ones the
 * entry's source stated.
 * Undefined when it states none. The other carbohydrate figure is the one
 * the entry's own carbs are not shown as (MM-396): total carbs while carbs
 * are shown net, net carbs while they are shown total, and only when fiber
 * or sugar alcohols make the two differ.
 */
export function extraNutrientsLine(e: FoodEntry, netCarbs: boolean): string | undefined {
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const parts: string[] = [];
  if (e.fiberG !== undefined) parts.push(`Fiber ${whole(e.fiberG)} g`);
  if (e.sugarAlcoholsG !== undefined) parts.push(`Sugar alcohols ${whole(e.sugarAlcoholsG)} g`);
  if (e.fiberG !== undefined || e.sugarAlcoholsG !== undefined) {
    parts.push(netCarbs ? `Total carbs ${whole(e.carbsG)} g` : `Net carbs ${whole(e.netCarbsG)} g`);
  }
  const sugars = e.micros.of('sugars');
  if (sugars !== undefined) parts.push(`Sugars ${whole(sugars)} g`);
  const saturatedFat = e.micros.of('saturatedFat');
  if (saturatedFat !== undefined) parts.push(`Saturated fat ${whole(saturatedFat)} g`);
  if (e.sodiumMg !== undefined) parts.push(`Sodium ${whole(e.sodiumMg)} mg`);
  if (e.alcoholG !== undefined && e.alcoholG > 0) parts.push(`Alcohol ${whole(e.alcoholG)} g`);
  return parts.length === 0 ? undefined : parts.join(' · ');
}
