const values = [
  /** The changes since last time were applied. */
  'updated',
  /**
   * The platform's token had expired, so everything was read again and
   * what is stored now matches the platform exactly.
   */
  'readAgain',
  /** The user has not let the app read this type. Nothing was touched. */
  'notPermitted',
] as const;

/** How an import went (MM-67). */
export type HealthImportStatus = (typeof values)[number];

export const HealthImportStatus = { values } as const;
