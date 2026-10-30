import type { CalendarDate } from '../../domain/CalendarDate';
import { CustomFood } from '../../domain/food/custom/CustomFood';
import type { FoodEntry } from '../../domain/FoodEntry';
import type { CustomFoodRepository } from '../../domain/repositories/CustomFoodRepository';
import type { FoodEntryBatchWriter } from '../../domain/repositories/FoodEntryBatchWriter';
import type { SetupReader } from '../../domain/repositories/SetupReader';
import type { WaterWriter } from '../../domain/repositories/WaterWriter';
import { waterAmount } from '../../format/waterAmount';
import { currentValueOf } from '../../lang/currentValueOf';
import { foodCopyOfBytes } from '../../transfer/foodCopyOfBytes';
import type { Overlays } from '../../ui/Overlays';
import { foodCopyKind } from './foodCopyKind';
import { foodCopyWords } from './foodCopyWords';
import { libraryFoodsWords } from './libraryFoodsWords';

/** Two Library foods are the same food when they share a name, however it is cased or spaced. */
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** `food` as a new food of this phone's Library. */
const asNew = (food: CustomFood) =>
  new CustomFood({
    id: 0,
    name: food.name,
    kind: food.kind,
    servingDescription: food.servingDescription,
    perServing: food.perServing,
    servingGrams: food.servingGrams,
    barcode: food.barcode,
    servings: food.servings,
    cookedWeightGrams: food.cookedWeightGrams,
    ingredients: food.ingredients,
    fiberG: food.fiberG,
    sugarAlcoholsG: food.sugarAlcoholsG,
    micros: food.micros,
    group: food.group,
    evidence: food.evidence,
    madeOf: food.madeOf,
  });

/**
 * `entry` logged from this phone's Library food `ids` maps its origin to, or from no saved food when there is none
 * to map to: its numbers stay, it is just not "from" a saved food here.
 */
const linked = (entry: FoodEntry, ids: ReadonlyMap<number, number>): FoodEntry => {
  const portion = entry.portion;
  const origin = portion?.origin;
  if (portion === undefined || origin === undefined || origin.packId !== 'custom') return entry;
  const id = ids.get(origin.foodId);
  return entry.copyWith({ portion: { ...portion, origin: id === undefined ? undefined : { ...origin, foodId: id } } });
};

/**
 * A copy of foods or water that arrived from the other phone (MM-715, MM-718): read, said and confirmed, then added
 * to this phone's log on the day and at the meal they were for, each food with its time eaten (MM-717) and each
 * drink at its moment, with Undo. The Library foods that came with it are the person's call: asked once the copy
 * is confirmed; saved, each entry is logged from this phone's own copy, a food this phone already has by name
 * standing for it (not duplicated, not overwritten); declined, the entries are logged from no saved food. Undo
 * takes back the entries, the drinks and the foods saved for them, never a food the phone had. A copy that does
 * not read, or a write that fails, changes nothing and says so.
 */
export async function addReceivedFoods(
  services: {
    readonly food: FoodEntryBatchWriter;
    readonly water: WaterWriter;
    readonly customFoods: CustomFoodRepository;
    readonly setup: SetupReader;
  },
  overlays: Overlays,
  bytes: Uint8Array,
  today: CalendarDate,
): Promise<void> {
  const copy = foodCopyOfBytes(bytes);
  if (copy === undefined) {
    overlays.snack('What arrived could not be read. Nothing on this phone was changed.');
    return;
  }
  const units = (await currentValueOf(services.setup.watchSetup()))?.unitSystem ?? 'metric';
  const kind = foodCopyKind(copy);
  const confirmed = await overlays.confirm({
    title: `Add ${kind} from your other phone?`,
    message: foodCopyWords(copy, today, units),
    confirmLabel: 'Add',
  });
  if (!confirmed) return;

  // The Library foods: which this phone has already, and whether the person wants the rest.
  const ids = new Map<number, number>();
  const library = copy.foods.length === 0 ? [] : await currentValueOf(services.customFoods.watchCustomFoods());
  const alreadyHere = copy.foods.flatMap((food) => {
    const mine = library.find((candidate) => sameName(candidate.name, food.name));
    return mine === undefined ? [] : [mine];
  });
  const keepLibrary =
    copy.foods.length > 0 &&
    (await overlays.confirm({
      title: copy.foods.length === 1 ? 'Save it to your Library?' : 'Save them to your Library?',
      message: libraryFoodsWords(copy.foods, alreadyHere),
      confirmLabel: 'Save',
      cancelLabel: 'Not now',
    }));

  const saved: number[] = [];
  const drinks: number[] = [];
  const foodsCount = copy.entries.length === 1 ? '1 food' : `${copy.entries.length} foods`;
  const waterTotal = copy.water.reduce((sum, drink) => sum + drink.ml, 0);
  const what = [...(copy.entries.length === 0 ? [] : [foodsCount]), ...(copy.water.length === 0 ? [] : [`${waterAmount(waterTotal, units)} of water`])].join(' and ');
  const What = what.charAt(0).toUpperCase() + what.slice(1);
  const undoAll = async (added: readonly number[]) => {
    if (added.length > 0) await services.food.applyFoodChanges({ delete: added }).catch(() => undefined);
    for (const id of drinks) await services.water.removeWater(id).catch(() => undefined);
    for (const id of saved) await services.customFoods.deleteCustomFood(id).catch(() => undefined);
  };
  let added: number[] = [];
  try {
    if (keepLibrary) {
      for (const food of copy.foods) {
        const mine = library.find((candidate) => sameName(candidate.name, food.name));
        if (mine !== undefined) {
          ids.set(food.id, mine.id);
          continue;
        }
        const id = await services.customFoods.saveCustomFood(asNew(food));
        saved.push(id);
        ids.set(food.id, id);
      }
    }
    if (copy.entries.length > 0) added = await services.food.applyFoodChanges({ add: copy.entries.map((entry) => linked(entry, ids)) });
    for (const drink of copy.water) drinks.push(await services.water.addWater(drink));
  } catch {
    await undoAll(added);
    overlays.snack(`${What} could not be added. Nothing on this phone was changed.`);
    return;
  }
  const toLibrary = saved.length === 0 ? '' : saved.length === 1 ? ', and 1 food to your Library' : `, and ${saved.length} foods to your Library`;
  overlays.snack(`Added ${what} from your other phone${toLibrary}`, {
    label: 'Undo',
    onAction: () => void undoAll(added),
  });
}
