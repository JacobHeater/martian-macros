import type { FoodEntry } from '../../FoodEntry';
import { Micronutrient } from './Micronutrient';
import { MicronutrientTotal } from './MicronutrientTotal';

/** Every tracked nutrient over `entries`, one day's foods, in the Micros view's order (MM-310). */
export function microsDayOf(entries: readonly FoodEntry[]): MicronutrientTotal[] {
  return Micronutrient.values.map((nutrient) => {
    let known = 0;
    let stated = 0;
    for (const entry of entries) {
      const amount = entry.micros.of(nutrient);
      if (amount === undefined) continue;
      known += amount;
      stated++;
    }
    return new MicronutrientTotal({ nutrient, known, stated, foods: entries.length });
  });
}
