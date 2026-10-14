const labels = {
  minerals: 'Minerals',
  vitamins: 'Vitamins',
  alsoOnLabel: 'Also on the label',
} as const;

/** The groups the Micros view lists the nutrients in (MM-310). */
export type MicronutrientGroup = keyof typeof labels;

export const MicronutrientGroup = {
  values: Object.keys(labels) as readonly MicronutrientGroup[],
  label: (group: MicronutrientGroup): string => labels[group],
} as const;
