import type { HealthChanges } from './HealthChanges';
import type { HealthDataType } from './HealthDataType';
import type { HealthSample } from './HealthSample';

/**
 * A phone's health platform, as the app sees it (MM-67). Health Connect,
 * HealthKit and the fake all sit behind this, and one test suite
 * (`healthSourceContract`) holds each to the same behavior.
 *
 * A source that cannot read the platform just now throws
 * `HealthReadFailure` from `read` and `changesSince`. It never answers
 * with nothing instead: nothing means there are no readings.
 *
 * It only reads. Writing is `HealthWriting` and `HealthIntakeWriter`
 * (MM-70), each kind with a permission of its own.
 */
export interface HealthSource {
  /** The types this platform has on this device at all. */
  available(): Promise<Set<HealthDataType>>;

  /** The types the user has let the app read. Always within `available`. */
  permitted(): Promise<Set<HealthDataType>>;

  /** Asks the user for `types`. Returns what is permitted afterwards. */
  requestPermission(types: ReadonlySet<HealthDataType>): Promise<Set<HealthDataType>>;

  /**
   * The readings of `type` that start from `from` up to, not including,
   * `to`, oldest first. Empty for a type that is not permitted.
   */
  read(type: HealthDataType, range: { from: Date; to: Date }): Promise<HealthSample[]>;

  /**
   * What changed in `type` since `token` was issued. With no token:
   * every reading there is, and a token to ask with next time. A token
   * the platform no longer honors gives an expired `HealthChanges`.
   */
  changesSince(type: HealthDataType, token: string | undefined): Promise<HealthChanges>;
}
