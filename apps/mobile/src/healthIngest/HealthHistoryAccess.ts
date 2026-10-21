/**
 * Whether the app may read further back than a platform lets it by default
 * (MM-73). Health Connect lets an app read only the thirty days before its
 * first permission was granted, and anything older needs a separate
 * permission; Apple Health has no such limit, so there it is always granted.
 *
 * Kept apart from `HealthSource` so that what only imports depends on no
 * more of it than `readableFrom` (MM-159, I).
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

  /**
   * The earliest start of a reading the platform shows the app just now
   * (MM-498), or undefined when it shows everything, as it does once the
   * history is permitted. A re-read after an expired token removes only
   * what is missing from this moment on: anything older may be kept
   * history the platform no longer lets the app see. A platform that
   * cannot say exactly answers later rather than earlier, so a kept
   * reading is never removed for being out of sight.
   */
  readableFrom(): Promise<Date | undefined>;
}
