import type { DeviceLock } from '../domain/integration/DeviceLock';
import type { DeviceLockOutcome } from '../domain/integration/DeviceLockOutcome';
import type { MmPrivacyApi } from './MmPrivacyApi';

/** The phone's own lock through the plugin (MM-157). A plugin that fails counts as not passed. */
export class NativeDeviceLock implements DeviceLock {
  private readonly api: MmPrivacyApi;

  constructor(api: MmPrivacyApi) {
    this.api = api;
  }

  async unlock(reason: string): Promise<DeviceLockOutcome> {
    try {
      return (await this.api.unlock({ reason })).outcome;
    } catch {
      return 'refused';
    }
  }
}
