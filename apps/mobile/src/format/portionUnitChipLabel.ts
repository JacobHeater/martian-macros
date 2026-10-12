import type { PortionUnit } from '../domain';

const labels: Readonly<Record<PortionUnit, string>> = {
  gram: 'Grams',
  ounce: 'Ounces',
  cup: 'Cups',
  tablespoon: 'Tablespoons',
  teaspoon: 'Teaspoons',
  milliliter: 'Milliliters',
  fluidOunce: 'Fluid ounces',
  serving: 'Servings',
  palm: 'Palms',
  cuppedHand: 'Cupped hands',
  thumb: 'Thumbs',
};

/** The unit on a choice chip, where no amount is attached. */
export const portionUnitChipLabel = (unit: PortionUnit): string => labels[unit];
