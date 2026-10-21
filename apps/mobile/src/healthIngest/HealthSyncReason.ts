const values = [
  /** The app was opened. */
  'opened',
  /** The app came back to the front after being in the background. */
  'resumed',
  /** The user asked for it, in Settings, or allowed a kind there. */
  'asked',
] as const;

/** Why the health platform is being read (MM-72). */
export type HealthSyncReason = (typeof values)[number];

export const HealthSyncReason = { values } as const;
