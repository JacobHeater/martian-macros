import type { DeviceLockOutcome } from './DeviceLockOutcome';

/** The phone's own lock, biometric or passcode (MM-157), asked before the photos are shown. */
export interface DeviceLock {
  /** Asks for the lock, saying `reason`. */
  unlock(reason: string): Promise<DeviceLockOutcome>;
}
