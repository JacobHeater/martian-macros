import type { CalendarDate } from '../../domain/CalendarDate';
import type { UnitSystem } from '../../domain/UnitSystem';
import { Fmt } from '../../format/Fmt';
import { currentValueOf } from '../../lang/currentValueOf';
import type { FoodCopy } from '../../transfer/FoodCopy';
import type { WholeDay } from '../../transfer/WholeDay';
import type { Overlays } from '../../ui/Overlays';
import type { DaySide } from './DaySide';
import { daySyncWords } from './daySyncWords';
import { linkedToLibrary } from './linkedToLibrary';
import type { ReceivingServices } from './ReceivingServices';
import { saveReceivedLibraryFoods } from './saveReceivedLibraryFoods';

/**
 * A whole day that arrived from the other phone (MM-719): what it holds and what this phone's day holds are said,
 * and once confirmed this phone's day is made to match: its foods for that day are replaced by the ones sent, in one
 * step, its water likewise, and its Refeed or Day off and its completeness set to the sender's. The Library foods
 * that came are the person's call, as with a copy (MM-715). Undo puts back everything this phone's day held and
 * takes back the foods saved. A write that fails puts back what was changed and says so.
 */
export async function syncReceivedDay(
  services: ReceivingServices,
  overlays: Overlays,
  copy: FoodCopy,
  whole: WholeDay,
  today: CalendarDate,
  units: UnitSystem,
): Promise<void> {
  const day = copy.day;
  const foodsHere = await currentValueOf(services.food.watchFood(day));
  const waterHere = await currentValueOf(services.water.watchWater(day));
  const kindHere = await currentValueOf(services.dayKinds.watchDayKind(day));
  const completenessHere = await currentValueOf(services.dayMarks.watchCompleteness(day));
  const sum = (ml: readonly { readonly ml: number }[]) => ml.reduce((total, drink) => total + drink.ml, 0);
  const arrived: DaySide = { foods: copy.entries.length, waterMl: sum(copy.water), kind: whole.kind, completeness: whole.completeness };
  const here: DaySide = { foods: foodsHere.length, waterMl: sum(waterHere), kind: kindHere, completeness: completenessHere };
  const said = Fmt.day(day, today);
  const when = day.epochDay >= today.epochDay - 1 ? said.toLowerCase() : said;

  const confirmed = await overlays.confirm({
    title: 'Sync this day from your other phone?',
    message: daySyncWords(day, arrived, here, today, units),
    confirmLabel: 'Sync',
  });
  if (!confirmed) return;

  let saved: readonly number[] = [];
  let foodsReplaced = false;
  const drinksAdded: number[] = [];
  const drinksRemoved: typeof waterHere = [];
  let marksSet = false;
  /** Puts this phone's day back as it was: whatever of the sync was done, undone in reverse. */
  const putBack = async () => {
    if (marksSet) {
      await services.dayKinds.setDayKind(day, kindHere).catch(() => undefined);
      await services.dayMarks.setCompleteness(day, completenessHere).catch(() => undefined);
    }
    for (const id of drinksAdded) await services.water.removeWater(id).catch(() => undefined);
    for (const drink of drinksRemoved) await services.water.addWater(drink).catch(() => undefined);
    if (foodsReplaced) {
      const now = await currentValueOf(services.food.watchFood(day));
      await services.food.applyFoodChanges({ delete: now.map((entry) => entry.id), add: foodsHere }).catch(() => undefined);
    }
    for (const id of saved) await services.customFoods.deleteCustomFood(id).catch(() => undefined);
  };
  try {
    const library = await saveReceivedLibraryFoods(services.customFoods, overlays, copy.foods);
    saved = library.saved;
    await services.food.applyFoodChanges({ delete: foodsHere.map((entry) => entry.id), add: copy.entries.map((entry) => linkedToLibrary(entry, library.ids)) });
    foodsReplaced = true;
    for (const drink of waterHere) {
      await services.water.removeWater(drink.id);
      drinksRemoved.push(drink);
    }
    for (const drink of copy.water) drinksAdded.push(await services.water.addWater(drink));
    marksSet = true;
    if (whole.kind !== kindHere) await services.dayKinds.setDayKind(day, whole.kind);
    if (whole.completeness !== completenessHere) await services.dayMarks.setCompleteness(day, whole.completeness);
  } catch {
    await putBack();
    overlays.snack(`${when.charAt(0).toUpperCase()}${when.slice(1)} could not be synced. This phone’s day is as it was.`);
    return;
  }
  const toLibrary = saved.length === 0 ? '' : saved.length === 1 ? ', and 1 food saved to your Library' : `, and ${saved.length} foods saved to your Library`;
  overlays.snack(`Synced ${when} from your other phone${toLibrary}`, { label: 'Undo', onAction: () => void putBack() });
}
