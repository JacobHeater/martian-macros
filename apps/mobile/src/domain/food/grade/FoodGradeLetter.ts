const values = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-'] as const;

/** A food's grade (MM-370): twelve steps from A+ to D-, with no E or F. */
export type FoodGradeLetter = (typeof values)[number];

export const FoodGradeLetter = { values } as const;
