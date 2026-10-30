import type { FoodEntry } from '../../domain/FoodEntry';

/**
 * `entry` logged from this phone's Library food `ids` maps its origin to (MM-715), or from no saved food when there
 * is none to map to: its numbers stay, it is just not "from" a saved food here.
 */
export function linkedToLibrary(entry: FoodEntry, ids: ReadonlyMap<number, number>): FoodEntry {
  const portion = entry.portion;
  const origin = portion?.origin;
  if (portion === undefined || origin === undefined || origin.packId !== 'custom') return entry;
  const id = ids.get(origin.foodId);
  return entry.copyWith({ portion: { ...portion, origin: id === undefined ? undefined : { ...origin, foodId: id } } });
}
