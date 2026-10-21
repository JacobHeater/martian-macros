import type { DaySteps } from './DaySteps';

/**
 * A day's steps as the platform itself totals them (MM-442, decided in
 * MM-71): Health Connect's aggregate, HealthKit's statistics. The platform
 * applies the source priority the person set in their phone's health
 * settings, so a walk that a phone and a watch both counted is counted
 * once. Adding up raw step readings would count it twice.
 *
 * Kept apart from `HealthSource` so that what only imports never depends on
 * it (MM-159, I). Like `read`, a platform that cannot be read just now
 * throws `HealthReadFailure`; it never answers with nothing instead.
 */
export interface HealthDailySteps {
  /**
   * Each local day from the one `from` falls on up to, not including, the
   * one `to` falls on, oldest first, with the days that have no steps left
   * out. Empty when steps are not permitted.
   */
  dailySteps(range: { from: Date; to: Date }): Promise<DaySteps[]>;
}
