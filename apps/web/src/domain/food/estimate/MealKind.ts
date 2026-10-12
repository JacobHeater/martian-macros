const splits = {
  /** A bit of everything. */
  balanced: { protein: 0.2, carbs: 0.5, fat: 0.3 },
  /** Pasta, rice, pizza. */
  mostlyCarbohydrate: { protein: 0.15, carbs: 0.65, fat: 0.2 },
  /** Meat or fish with vegetables. */
  mostlyProtein: { protein: 0.35, carbs: 0.3, fat: 0.35 },
  /** Fried, creamy or dessert-heavy. */
  rich: { protein: 0.12, carbs: 0.38, fat: 0.5 },
} as const;

/**
 * What a roughly estimated meal was mostly made of, which sets its macro
 * split by share of energy (MM-150). The splits are judgement, not data.
 */
export type MealKind = keyof typeof splits;

export const MealKind = {
  values: Object.keys(splits) as readonly MealKind[],

  /** Shares of the meal's energy; they add to one. */
  split(kind: MealKind): { readonly protein: number; readonly carbs: number; readonly fat: number } {
    return splits[kind];
  },
} as const;
