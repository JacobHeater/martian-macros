const labels = {
  sugars: 'sugars',
  saturatedFat: 'saturated fat',
  micronutrients: 'vitamins and minerals',
} as const;

/**
 * What a graded food's source did not state and so was left out of its
 * grade (MM-380, MM-382): the refinements the method counts only when
 * stated. The popover names them, so two foods with the same letter on
 * different data are told apart on a tap.
 */
export type GradeOmission = keyof typeof labels;

export const GradeOmission = {
  values: Object.keys(labels) as readonly GradeOmission[],

  /** As said: "saturated fat". */
  label: (omission: GradeOmission): string => labels[omission],
} as const;
