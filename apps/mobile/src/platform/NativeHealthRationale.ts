import type { HealthRationale } from '../domain/integration/HealthRationale';
import type { MmHealthRationaleApi } from './MmHealthRationaleApi';

/** Health Connect's link to why the app asks (MM-731), over the app's own plugin. */
export class NativeHealthRationale implements HealthRationale {
  private readonly api: MmHealthRationaleApi;

  constructor(api: MmHealthRationaleApi) {
    this.api = api;
  }

  async requested(): Promise<boolean> {
    try {
      return (await this.api.rationaleRequested()).requested;
    } catch {
      return false;
    }
  }
}
