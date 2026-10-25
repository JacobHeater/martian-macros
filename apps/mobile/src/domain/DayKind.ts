const values = [
  /** An ordinary day: not marked. */
  'none',
  /** A day eaten higher on purpose (MM-611). */
  'refeed',
  /** A day away from the plan: a holiday, a party, travel (MM-611). */
  'dayOff',
] as const;

/**
 * What kind of day the person marked a day as (MM-611): an ordinary one, a
 * Refeed or a Day off. Separate from completeness (MM-27): a Day off may be
 * partly logged and is still partial if it is. It changes no calculation.
 */
export type DayKind = (typeof values)[number];

export const DayKind = { values } as const;
