import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';
import { Fmt } from '../../format/Fmt';
import { mealLabel } from '../../format/mealLabel';
import type { FoodCopy } from '../../transfer/FoodCopy';

/** A list in a sentence: "Salmon, Rice and Apple", at most five named, the rest counted. */
const listed = (names: readonly string[]): string => {
  const shown = names.slice(0, 5);
  const more = names.length - shown.length;
  if (more > 0) return `${shown.join(', ')} and ${more} more`;
  if (shown.length <= 1) return shown.join('');
  return `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
};

/** A day as it reads inside a sentence: "today", "yesterday", or its date. */
const dayInSentence = (day: CalendarDate, today: CalendarDate) => {
  const said = Fmt.day(day, today);
  return day.epochDay >= today.epochDay - 1 ? said.toLowerCase() : Fmt.longDate(day);
};

/**
 * What a copy of foods from the other phone is, asked before it is added (MM-715): how many, for which meal and
 * day, named, a logged meal once by its name; then that they are added and nothing here is replaced.
 */
export function foodCopyWords(copy: FoodCopy, today: CalendarDate): string {
  const count = copy.entries.length === 1 ? '1 food' : `${copy.entries.length} foods`;
  const meals = [...new Set<Meal>(copy.entries.map((entry) => entry.meal))].map((meal) => mealLabel(meal).toLowerCase());
  const names: string[] = [];
  for (const entry of copy.entries) {
    const name = entry.loggedMeal === undefined ? entry.name : entry.loggedMeal.name;
    if (!names.includes(name)) names.push(name);
  }
  return `Your other phone sent ${count} for ${listed(meals)} ${dayInSentence(copy.day, today)}: ${listed(names)}.\n\nThey are added to this phone, on that day and at that meal. Nothing here is replaced.`;
}
