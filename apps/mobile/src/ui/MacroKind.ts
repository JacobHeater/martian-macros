const labels = { protein: 'Protein', carbs: 'Carbs', fat: 'Fat' } as const;

/** The three macronutrients, each with one fixed color (see `MacroBar`). */
export type MacroKind = keyof typeof labels;

export const MacroKind = {
  values: Object.keys(labels) as readonly MacroKind[],

  /** The macro's name; carbs are "Net carbs" while carbs are shown net (MM-396). */
  label(macro: MacroKind, { netCarbs = false }: { netCarbs?: boolean } = {}): string {
    return macro === 'carbs' && netCarbs ? 'Net carbs' : labels[macro];
  },
} as const;
