const values = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
] as const;

/**
 * What an exercise trains (MM-76), and what weekly volume is counted per
 * (MM-78).
 */
export type MuscleGroup = (typeof values)[number];

export const MuscleGroup = { values } as const;
