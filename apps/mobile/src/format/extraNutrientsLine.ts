import type { FoodEntry } from '../domain';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/**
 * Fiber, net carbohydrate, sodium and alcohol for Full detail (MM-49), only
 * the ones the entry's source stated. Undefined when it states none.
 */
export function extraNutrientsLine(e: FoodEntry): string | undefined {
  const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
  const parts: string[] = [];
  if (e.fiberG !== undefined) parts.push(`Fiber ${whole(e.fiberG)} g`);
  if (e.netCarbsG !== undefined) parts.push(`Net carbs ${whole(e.netCarbsG)} g`);
  if (e.sodiumMg !== undefined) parts.push(`Sodium ${whole(e.sodiumMg)} mg`);
  if (e.alcoholG !== undefined && e.alcoholG > 0) parts.push(`Alcohol ${whole(e.alcoholG)} g`);
  return parts.length === 0 ? undefined : parts.join(' · ');
}
