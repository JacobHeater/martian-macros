const values = [
  /** Kilograms. */
  'weight',
  /** Percent of body weight. */
  'bodyFat',
  /** Kilograms. */
  'leanMass',
  /** Centimeters. */
  'height',
  /** A session, for when and how long: its value is its length in minutes. */
  'workout',
  /** A day of flow: its value is 1. */
  'menstruation',
  /**
   * A count over the sample's span. For context only, never for the
   * expenditure estimate.
   */
  'steps',
  /**
   * A session of sleep (MM-250): its value is the minutes asleep in it, its
   * span when it began and ended. Several in a night are summed by the app.
   */
  'sleep',
] as const;

/**
 * What the app reads from a health platform (MM-66). Each has one unit,
 * the same from every platform.
 */
export type HealthDataType = (typeof values)[number];

export const HealthDataType = { values } as const;
