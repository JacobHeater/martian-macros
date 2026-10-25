import type { FoodEntry } from '../../../domain/FoodEntry';
import { gramsFor } from '../../../domain/food/portion/gramsFor';

/** The grams an entry was logged as, when they can be known without guessing (MM-167); undefined otherwise. */
export function entryGramsOf(entry: FoodEntry): number | undefined {
  const portion = entry.portion;
  if (portion === undefined || portion.quantity === undefined || portion.unit === undefined) return undefined;
  if (portion.impliedGrams !== undefined) return portion.impliedGrams;
  if (portion.reference === undefined) return undefined;
  return gramsFor(portion.quantity, portion.unit, portion.reference);
}
