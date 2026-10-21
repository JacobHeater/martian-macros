/**
 * Whether the app may read further back than a platform lets it by default
 * (MM-73). Health Connect lets an app read only the thirty days before its
 * first permission was granted, and anything older needs a separate
 * permission; Apple Health has no such limit, so there it is always granted.
 *
 * Kept apart from `HealthSource` so that what only imports never depends on
 * it (MM-159, I).
 */
export interface HealthHistoryAccess {
  /** Whether readings older than the platform's default window can be read. */
  historyPermitted(): Promise<boolean>;

  /**
   * Asks the user for it, at most once ever: when it was asked before, or
   * the platform has nothing to ask, this only says how it stands. Whether
   * it is granted afterwards.
   */
  requestHistory(): Promise<boolean>;
}
