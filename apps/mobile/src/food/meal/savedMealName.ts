import type { FoodEntry } from '../../domain/FoodEntry';

/** A first name for a meal being saved (MM-645), from its foods: "Oats, berries and yogurt", "Oats, berries and 3 more". */
export function savedMealName(foods: readonly FoodEntry[]): string {
  const names = foods.map((food, i) => (i === 0 ? food.name : food.name.charAt(0).toLowerCase() + food.name.slice(1)));
  if (names.length <= 1) return names[0] ?? '';
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}
