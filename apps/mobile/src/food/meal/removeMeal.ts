import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import type { FoodEntryWriter } from '../../domain/repositories/FoodEntryWriter';
import type { Overlays } from '../../ui/Overlays';

/**
 * Deletes every food of `loggedMeal` and offers to put the meal back for a
 * few seconds (MM-587), as a food's delete does (MM-48). Put back, its
 * foods are the same meal again: they keep its key and name.
 */
export async function removeMeal(writer: FoodEntryWriter, overlays: Overlays, loggedMeal: LoggedMeal): Promise<void> {
  for (const item of loggedMeal.items) await writer.deleteFood(item.id);
  overlays.snack(`Removed ${loggedMeal.name}`, {
    label: 'Undo',
    onAction: () => {
      void (async () => {
        for (const item of loggedMeal.items) await writer.addFood(item);
      })();
    },
  });
}
