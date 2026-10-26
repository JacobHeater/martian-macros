import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import type { FoodEntryBatchWriter } from '../../domain/repositories/FoodEntryBatchWriter';
import type { Overlays } from '../../ui/Overlays';

/**
 * Deletes every food of `loggedMeal` and offers to put the meal back for a
 * few seconds (MM-587), as a food's delete does (MM-48). Put back, its
 * foods are the same meal again: they keep its key and name. The meal goes,
 * and comes back, whole and at once (MM-625).
 */
export async function removeMeal(writer: FoodEntryBatchWriter, overlays: Overlays, loggedMeal: LoggedMeal): Promise<void> {
  await writer.applyFoodChanges({ delete: loggedMeal.items.map((item) => item.id) });
  overlays.snack(`Removed ${loggedMeal.name}`, {
    label: 'Undo',
    onAction: () => void writer.applyFoodChanges({ add: loggedMeal.items }),
  });
}
