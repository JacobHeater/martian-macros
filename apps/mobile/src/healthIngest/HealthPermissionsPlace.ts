import type { HealthDataType } from './HealthDataType';

/**
 * Where a person allows what the app can no longer ask for itself (MM-323,
 * MM-523): Health Connect stops showing an app's request for a kind once it
 * has been refused more than twice, and asks for the history permission
 * (MM-73) only once. After that, the platform's own screen of this app's
 * permissions is the place to allow it.
 *
 * Kept apart from `HealthSource` so that what only imports never depends on
 * it (MM-159, I).
 */
export interface HealthPermissionsPlace {
  /**
   * Whether the platform no longer shows the app's request for `type`: the
   * last time it was asked for, the answer came back refused without the
   * question having been shown. False until it has been asked for.
   */
  stoppedAsking(type: HealthDataType): Promise<boolean>;

  /**
   * Opens the platform's own screen of this app's permissions, and answers
   * once the person is back. False where there is none to open.
   */
  openPermissions(): Promise<boolean>;
}
