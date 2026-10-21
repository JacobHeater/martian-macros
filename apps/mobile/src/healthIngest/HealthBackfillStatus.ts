const values = [
  /** Everything up to a year back has been read, now or before. */
  'done',
  /**
   * The platform keeps the app to its default window (the history
   * permission was refused), so there is nothing further back to read. The
   * import has the window already. Nothing was touched or marked, so a
   * permission granted later is acted on.
   */
  'noHistory',
  /** The user has not let the app read this type. Nothing was touched. */
  'notPermitted',
] as const;

/** How a backfill went (MM-73). */
export type HealthBackfillStatus = (typeof values)[number];

export const HealthBackfillStatus = { values } as const;
