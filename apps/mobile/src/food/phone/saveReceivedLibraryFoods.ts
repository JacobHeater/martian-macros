import { CustomFood } from '../../domain/food/custom/CustomFood';
import type { CustomFoodRepository } from '../../domain/repositories/CustomFoodRepository';
import { currentValueOf } from '../../lang/currentValueOf';
import type { Overlays } from '../../ui/Overlays';
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
 * The Library foods that came with a copy (MM-715), once the copy is confirmed: the person is asked whether to save
 * them, and each is saved as this phone's own, a food this phone already has by name standing for it (not
 * duplicated, not overwritten). Gives the sending phone's ids mapped to this phone's, for linking the entries, and
 * the ids saved here, for Undo; declined, the map is empty and the entries are logged from no saved food. A save
 * that fails takes back the ones saved before it and throws.
 */
export async function saveReceivedLibraryFoods(
  customFoods: CustomFoodRepository,
  overlays: Overlays,
  arrived: readonly CustomFood[],
): Promise<{ ids: ReadonlyMap<number, number>; saved: readonly number[] }> {
  const ids = new Map<number, number>();
  const saved: number[] = [];
  if (arrived.length === 0) return { ids, saved };
  const library = await currentValueOf(customFoods.watchCustomFoods());
  const mineFor = (food: CustomFood) => library.find((candidate) => sameName(candidate.name, food.name));
  const alreadyHere = arrived.flatMap((food) => {
    const mine = mineFor(food);
    return mine === undefined ? [] : [mine];
  });
  const keep = await overlays.confirm({
    title: arrived.length === 1 ? 'Save it to your Library?' : 'Save them to your Library?',
    message: libraryFoodsWords(arrived, alreadyHere),
    confirmLabel: 'Save',
    cancelLabel: 'Not now',
  });
  if (!keep) return { ids, saved };
  try {
    for (const food of arrived) {
      const mine = mineFor(food);
      if (mine !== undefined) {
        ids.set(food.id, mine.id);
        continue;
      }
      const id = await customFoods.saveCustomFood(asNew(food));
      saved.push(id);
      ids.set(food.id, id);
    }
  } catch (error) {
    for (const id of saved) await customFoods.deleteCustomFood(id).catch(() => undefined);
    throw error;
  }
  return { ids, saved };
}
