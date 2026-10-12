const values = [
  /** The free tier. */
  'free',
  /** The Coach trial is running. */
  'trial',
  /** Coach is unlocked for good. */
  'unlocked',
] as const;

/** What the user has unlocked. */
export type EntitlementStatus = (typeof values)[number];

export const EntitlementStatus = { values } as const;
