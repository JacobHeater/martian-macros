import type { FoodGroup } from '../domain/food/FoodGroup';

const labels: Readonly<Record<FoodGroup, string>> = {
  breakfastCereals: 'Breakfast cereals',
  dairyAndYogurt: 'Dairy and yogurt',
  meatAndPoultry: 'Meat and poultry',
  fish: 'Fish and shellfish',
  eggs: 'Eggs',
  legumes: 'Legumes and meat alternatives',
  nutsAndSeeds: 'Nuts and seeds',
  breadsAndGrains: 'Breads and grains',
  fruit: 'Fruit',
  vegetables: 'Vegetables',
  snacksAndSweets: 'Snacks and sweets',
  spreadsAndSauces: 'Spreads and sauces',
  fatsAndOils: 'Fats and oils',
  preparedMeals: 'Prepared meals',
  drinks: 'Drinks',
};

/** A food group (MM-616) in words, as the group chooser and a food's row say it (MM-710). */
export const foodGroupLabel = (group: FoodGroup): string => labels[group];
