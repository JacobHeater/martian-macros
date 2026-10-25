const groups = [
  'breakfastCereals',
  'dairyAndYogurt',
  'meatAndPoultry',
  'fish',
  'eggs',
  'legumes',
  'nutsAndSeeds',
  'breadsAndGrains',
  'fruit',
  'vegetables',
  'snacksAndSweets',
  'spreadsAndSauces',
  'fatsAndOils',
  'preparedMeals',
  'drinks',
] as const;

/**
 * What kind of food a catalog food is (MM-616), so the coach can trade a
 * food for another of its kind (MM-607): granola for another breakfast
 * cereal, never for canned tuna. A small fixed set, mapped in the food
 * pipeline from the source's own category. `fish` includes shellfish;
 * `legumes` includes soy and meat alternatives. A food without a group is
 * never offered as a trade.
 */
export type FoodGroup = (typeof groups)[number];

export const FoodGroup = {
  values: groups as readonly FoodGroup[],

  /** The group a pack stores as `name`; undefined for a name this code does not know. */
  fromName(name: string | undefined): FoodGroup | undefined {
    return groups.find((group) => group === name);
  },
} as const;
