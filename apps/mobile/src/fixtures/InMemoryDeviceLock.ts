import type { DeviceLock } from '../domain/integration/DeviceLock';
import type { DeviceLockOutcome } from '../domain/integration/DeviceLockOutcome';

/** The phone's lock in memory (MM-157): answers `answer`, and counts how often it was asked. */
export class InMemoryDeviceLock implements DeviceLock {
  answer: DeviceLockOutcome;
  asked = 0;

  constructor(answer: DeviceLockOutcome = 'unlocked') {
    this.answer = answer;
  }

  async unlock(): Promise<DeviceLockOutcome> {
    this.asked++;
    return this.answer;
  }
}
