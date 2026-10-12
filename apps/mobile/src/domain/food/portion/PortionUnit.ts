const values = [
  'gram',
  /** Weight ounce (avoirdupois). Never a fluid ounce. */
  'ounce',
  /** US legal cup. */
  'cup',
  'tablespoon',
  'teaspoon',
  'milliliter',
  /** US fluid ounce: a volume, so it needs a density to become weight. */
  'fluidOunce',
  /** A serving as the food's label or source defines it. */
  'serving',
  'palm',
  'cuppedHand',
  'thumb',
] as const;

const gramsPerOunce = 28.349523125;
const mlPerCup = 236.588236;
const mlPerTablespoon = 14.78676478125;
const mlPerTeaspoon = 4.92892159375;
const mlPerFluidOunce = 29.5735295625;

const gramsIn: Partial<Record<PortionUnit, number>> = { gram: 1, ounce: gramsPerOunce };

const millilitersIn: Partial<Record<PortionUnit, number>> = {
  cup: mlPerCup,
  tablespoon: mlPerTablespoon,
  teaspoon: mlPerTeaspoon,
  milliliter: 1,
  fluidOunce: mlPerFluidOunce,
};

/**
 * The unit an amount is counted in (MM-167). Weight and volume units have
 * exact constants; the hand units are counts of a portion and have none.
 */
export type PortionUnit = (typeof values)[number];

export const PortionUnit = {
  values,
  gramsPerOunce,
  mlPerCup,
  mlPerTablespoon,
  mlPerTeaspoon,
  mlPerFluidOunce,

  isWeight(unit: PortionUnit): boolean {
    return gramsIn[unit] !== undefined;
  },

  isVolume(unit: PortionUnit): boolean {
    return millilitersIn[unit] !== undefined;
  },

  /** A count of a hand-sized portion. */
  isHand(unit: PortionUnit): boolean {
    return unit === 'palm' || unit === 'cuppedHand' || unit === 'thumb';
  },

  /** Grams in one of this unit, or undefined if it is not a weight. */
  grams(unit: PortionUnit): number | undefined {
    return gramsIn[unit];
  },

  /** Millilitres in one of this unit, or undefined if it is not a volume. */
  milliliters(unit: PortionUnit): number | undefined {
    return millilitersIn[unit];
  },
} as const;
