const labels = { protein: 'Protein', carbs: 'Carbs', fat: 'Fat' } as const;

/** The three macronutrients, each with one fixed color (see `MacroBar`). */
export type MacroKind = keyof typeof labels;

export const MacroKind = {
  values: Object.keys(labels) as readonly MacroKind[],

  label(macro: MacroKind): string {
    return labels[macro];
  },
} as const;
