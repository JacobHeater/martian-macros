import type { PortionUnit } from '../domain';

const names: Readonly<Record<PortionUnit, readonly [one: string, many: string]>> = {
  gram: ['g', 'g'],
  ounce: ['oz', 'oz'],
  cup: ['cup', 'cups'],
  tablespoon: ['tbsp', 'tbsp'],
  teaspoon: ['tsp', 'tsp'],
  milliliter: ['mL', 'mL'],
  fluidOunce: ['fl oz', 'fl oz'],
  serving: ['serving', 'servings'],
  palm: ['palm', 'palms'],
  cuppedHand: ['cupped hand', 'cupped hands'],
  thumb: ['thumb', 'thumbs'],
};

/** How a unit reads next to an amount of `quantity` (MM-167): "1 cup", "2 cups". */
export const portionUnitOf = (unit: PortionUnit, quantity: number): string => names[unit][quantity === 1 ? 0 : 1];
