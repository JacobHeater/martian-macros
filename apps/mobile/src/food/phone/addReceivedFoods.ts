import type { CalendarDate } from '../../domain/CalendarDate';
import { waterAmount } from '../../format/waterAmount';
import { currentValueOf } from '../../lang/currentValueOf';
import { foodCopyOfBytes } from '../../transfer/foodCopyOfBytes';
import type { Overlays } from '../../ui/Overlays';
import { foodCopyKind } from './foodCopyKind';
import { foodCopyWords } from './foodCopyWords';
import { linkedToLibrary } from './linkedToLibrary';
import type { ReceivingServices } from './ReceivingServices';
import { saveReceivedLibraryFoods } from './saveReceivedLibraryFoods';
import { syncReceivedDay } from './syncReceivedDay';

/**
 * A copy of foods or water that arrived from the other phone (MM-715, MM-718): read, said and confirmed, then added
 * to this phone's log on the day and at the meal they were for, each food with its time eaten (MM-717) and each
 * drink at its moment, with Undo. The Library foods that came with it are the person's call
 * (`saveReceivedLibraryFoods`). Undo takes back the entries, the drinks and the foods saved for them, never a food
 * the phone had. A whole day (MM-719) goes to `syncReceivedDay` instead. A copy that does not read, or a write that
 * fails, changes nothing and says so.
 */
export async function addReceivedFoods(services: ReceivingServices, overlays: Overlays, bytes: Uint8Array, today: CalendarDate): Promise<void> {
  const copy = foodCopyOfBytes(bytes);
  if (copy === undefined) {
    overlays.snack('What arrived could not be read. Nothing on this phone was changed.');
    return;
  }
  const units = (await currentValueOf(services.setup.watchSetup()))?.unitSystem ?? 'metric';
  if (copy.whole !== undefined) return syncReceivedDay(services, overlays, copy, copy.whole, today, units);
  const kind = foodCopyKind(copy);
  const confirmed = await overlays.confirm({
    title: `Add ${kind} from your other phone?`,
    message: foodCopyWords(copy, today, units),
    confirmLabel: 'Add',
  });
  if (!confirmed) return;

  const foodsCount = copy.entries.length === 1 ? '1 food' : `${copy.entries.length} foods`;
  const waterTotal = copy.water.reduce((sum, drink) => sum + drink.ml, 0);
  const what = [...(copy.entries.length === 0 ? [] : [foodsCount]), ...(copy.water.length === 0 ? [] : [`${waterAmount(waterTotal, units)} of water`])].join(' and ');
  const What = what.charAt(0).toUpperCase() + what.slice(1);
  let saved: readonly number[] = [];
  let added: number[] = [];
  const drinks: number[] = [];
  const undoAll = async () => {
    if (added.length > 0) await services.food.applyFoodChanges({ delete: added }).catch(() => undefined);
    for (const id of drinks) await services.water.removeWater(id).catch(() => undefined);
    for (const id of saved) await services.customFoods.deleteCustomFood(id).catch(() => undefined);
  };
  try {
    const library = await saveReceivedLibraryFoods(services.customFoods, overlays, copy.foods);
    saved = library.saved;
    if (copy.entries.length > 0) added = await services.food.applyFoodChanges({ add: copy.entries.map((entry) => linkedToLibrary(entry, library.ids)) });
    for (const drink of copy.water) drinks.push(await services.water.addWater(drink));
  } catch {
    await undoAll();
    overlays.snack(`${What} could not be added. Nothing on this phone was changed.`);
    return;
  }
  const toLibrary = saved.length === 0 ? '' : saved.length === 1 ? ', and 1 food to your Library' : `, and ${saved.length} foods to your Library`;
  overlays.snack(`Added ${what} from your other phone${toLibrary}`, { label: 'Undo', onAction: () => void undoAll() });
}
