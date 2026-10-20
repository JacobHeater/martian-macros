import type { FoodEntry } from '../domain/FoodEntry';

/** The id of a row's lines (macros, extras, portion), so the row's press is described by them for a reader (MM-429). */
export const foodEntryLinesId = (entry: FoodEntry): string => `food-entry-${entry.id}-lines`;
