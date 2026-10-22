import type { DeviceLock } from '../domain/integration/DeviceLock';
import type { DeviceLockOutcome } from '../domain/integration/DeviceLockOutcome';

/** Off the phone (the development build): there is no lock to ask (MM-157). */
export class NoDeviceLock implements DeviceLock {
  async unlock(): Promise<DeviceLockOutcome> {
    return 'noLock';
  }
}
