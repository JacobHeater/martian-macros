import type { HealthWriteKind } from './HealthWriteKind';

/**
 * Which kinds the app writes to the phone's health platform (MM-70,
 * MM-314, MM-513, MM-489). Each is off until the user turns it on, and
 * turning it on asks the platform for that kind's write permission alone,
 * never with reading. A kind is written only while it is on and the
 * platform still permits it. Whether it is on is kept by the platform's
 * plugin, on the phone, so it outlives the app closing.
 */
export interface HealthWriting {
  /** The kinds written now: turned on, and permitted by the platform. */
  writing(): Promise<Set<HealthWriteKind>>;

  /**
   * Asks the platform to let the app write `kind`, and turns it on if it
   * may. Returns whether it is on afterwards; refused, it stays off.
   */
  startWriting(kind: HealthWriteKind): Promise<boolean>;

  /** Turns `kind` off: nothing more is written. What was written stays on the platform until it is removed. */
  stopWriting(kind: HealthWriteKind): Promise<void>;

  /**
   * Removes from the platform everything of `kind` the app wrote, under any
   * write namespace (MM-514): only the app's own records, found by
   * `healthWritePrefix`, never another app's. It needs the kind's write
   * permission, not the kind turned on, so it can follow turning it off.
   * Turns nothing on or off. False when the platform would not remove them
   * or was never allowed to take that kind.
   */
  removeWritten(kind: HealthWriteKind): Promise<boolean>;
}
