import type { FoodGroup } from '../../../domain/food/FoodGroup';

/** The catalog groups a lean protein food is looked for in (MM-684). */
export const proteinGroups: readonly FoodGroup[] = ['meatAndPoultry', 'fish', 'eggs', 'dairyAndYogurt', 'legumes'];
