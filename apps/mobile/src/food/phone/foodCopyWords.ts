import type { CalendarDate } from '../../domain/CalendarDate';
import type { Meal } from '../../domain/Meal';
import type { UnitSystem } from '../../domain/UnitSystem';
import { Fmt } from '../../format/Fmt';
import { mealLabel } from '../../format/mealLabel';
import { waterAmount } from '../../format/waterAmount';
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

/** The foods of a copy, counted: "2 foods". */
const foodsCounted = (copy: FoodCopy) => (copy.entries.length === 1 ? '1 food' : `${copy.entries.length} foods`);

/** The water of a copy, as an amount in the person's units, in drinks when more than one: "32 fl oz of water in 2 drinks". */
const waterCounted = (copy: FoodCopy, units: UnitSystem) => {
  const total = copy.water.reduce((sum, drink) => sum + drink.ml, 0);
  return `${waterAmount(total, units)} of water${copy.water.length > 1 ? ` in ${copy.water.length} drinks` : ''}`;
};

/**
 * What a copy from the other phone is, asked before it is added (MM-715, MM-718): how many foods for which meal, how
 * much water, for which day, the foods named, a logged meal once by its name; then that they are added and nothing
 * here is replaced.
 */
export function foodCopyWords(copy: FoodCopy, today: CalendarDate, units: UnitSystem): string {
  const meals = [...new Set<Meal>(copy.entries.map((entry) => entry.meal))].map((meal) => mealLabel(meal).toLowerCase());
  const names: string[] = [];
  for (const entry of copy.entries) {
    const name = entry.loggedMeal === undefined ? entry.name : entry.loggedMeal.name;
    if (!names.includes(name)) names.push(name);
  }
  const sent = [
    ...(copy.entries.length === 0 ? [] : [`${foodsCounted(copy)} for ${listed(meals)}`]),
    ...(copy.water.length === 0 ? [] : [waterCounted(copy, units)]),
  ].join(' and ');
  const named = names.length === 0 ? '' : `: ${listed(names)}`;
  const added =
    copy.entries.length > 0
      ? 'They are added to this phone, on that day and at that meal.'
      : copy.water.length > 1
        ? 'They are added to this phone, on that day.'
        : 'It is added to this phone, on that day.';
  return `Your other phone sent ${sent} ${dayInSentence(copy.day, today)}${named}.\n\n${added} Nothing here is replaced.`;
}
