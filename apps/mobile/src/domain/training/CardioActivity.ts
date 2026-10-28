const values = [
  'walking',
  'running',
  'hiking',
  'cycling',
  'elliptical',
  'rowing',
  'stairClimbing',
  'swimming',
  /** Interval training: counted, since every non-strength session counts (the owner, 2026-10-28), but not steady state. */
  'intervals',
  /** Any other non-strength session: sport, dance, yoga, whatever the watch called it. */
  'other',
] as const;

/**
 * What a health platform called a cardio session (MM-677): every
 * non-strength session counts (the owner, 2026-10-28), named by one of
 * these. Each shell maps its platform's own types to them; a strength type
 * stays a workout (MM-490).
 */
export type CardioActivity = (typeof values)[number];

export const CardioActivity = {
  values,

  /** The activity by its name, or undefined for a name that is none of them (an older plugin, a strength session). */
  named(name: string | undefined): CardioActivity | undefined {
    return values.find((value) => value === name);
  },
} as const;
