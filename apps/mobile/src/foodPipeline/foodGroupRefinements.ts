import type { FoodGroup } from '../domain/food/FoodGroup';

/**
 * Where one USDA category holds foods of two groups, the food's name decides
 * (MM-616): SR Legacy and Foundation put eggs with dairy, juices with fruit
 * and vegetables, and cookies and cakes with bread. A food in `category`
 * whose name matches `name` is in `group` instead of the category's group.
 */
export const foodGroupRefinements: readonly { readonly category: string; readonly name: RegExp; readonly group: FoodGroup }[] = [
  { category: 'Dairy and Egg Products', name: /^eggs?\b/i, group: 'eggs' },
  { category: 'Fruits and Fruit Juices', name: /\bjuices?\b/i, group: 'drinks' },
  { category: 'Vegetables and Vegetable Products', name: /\bjuices?\b/i, group: 'drinks' },
  {
    category: 'Baked Products',
    name: /^(cookies?|cakes?|cheesecake|pies?|pie crust|doughnuts?|brownies?|danish pastry|pastry|puff pastry|sweet rolls?|croissants?|toaster pastries|ice cream cones?)\b/i,
    group: 'snacksAndSweets',
  },
];
