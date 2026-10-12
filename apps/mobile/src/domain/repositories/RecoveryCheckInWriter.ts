import type { RecoveryCheckIn } from '../RecoveryCheckIn';

/** Writes the weekly recovery check-ins (MM-116). */
export interface RecoveryCheckInWriter {
  /** Adds `checkIn`, or replaces the one answered on the same day. */
  saveRecoveryCheckIn(checkIn: RecoveryCheckIn): Promise<void>;
}
