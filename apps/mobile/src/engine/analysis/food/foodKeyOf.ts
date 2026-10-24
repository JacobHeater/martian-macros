import type { FoodEntry } from '../../../domain/FoodEntry';

/** Entries of one food share this key (MM-606): the name, trimmed and in lower case, as the trades read it (MM-607). */
export function foodKeyOf(entry: FoodEntry): string {
  return entry.name.trim().toLowerCase();
}
