const values = [
  /** The gram weight the source gives its serving, or a volume the serving is also stated in. */
  'servingWeight',
  /** The food's own density, for a volume. */
  'density',
  /** The hand-portion model (MM-46). */
  'handModel',
] as const;

/** How an amount's unit was turned into grams when it was logged (MM-167). */
export type ConversionKind = (typeof values)[number];

export const ConversionKind = { values } as const;
