import type { FoodEntry } from '../../domain/FoodEntry';
import type { Overlays } from '../../ui/Overlays';
import { SaveMealSheet } from './SaveMealSheet';

/** Opens the sheet that saves `foods` as a meal to log again (MM-645). */
export function showSaveMealSheet(overlays: Overlays, foods: readonly FoodEntry[]): Promise<void> {
  return overlays.sheet<void>('Save as a meal', (close) => <SaveMealSheet foods={foods} onDone={() => close()} />).then(() => undefined);
}
