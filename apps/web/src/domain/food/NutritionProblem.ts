const values = [
  'missingName',
  'missingValue',
  'negativeValue',
  'macrosExceed100g',
  'energyTooHigh',
  'energyDisagreesWithMacros',
] as const;

/** Why a food's nutrition values are rejected (MM-53), checked in this order. */
export type NutritionProblem = (typeof values)[number];

export const NutritionProblem = { values } as const;
