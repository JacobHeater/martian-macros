import type { PrivateScreen } from '../domain/integration/PrivateScreen';
import type { MmPrivacyApi } from './MmPrivacyApi';

/**
 * The screen kept private through the plugin (MM-157): hidden while any
 * caller hides it, shown again when the last stops.
 */
export class NativePrivateScreen implements PrivateScreen {
  private readonly api: MmPrivacyApi;
  private hiders = 0;

  constructor(api: MmPrivacyApi) {
    this.api = api;
  }

  hide(): () => void {
    if (this.hiders++ === 0) void this.api.protectScreen({ on: true }).catch(() => undefined);
    let shown = false;
    return () => {
      if (shown) return;
      shown = true;
      if (--this.hiders === 0) void this.api.protectScreen({ on: false }).catch(() => undefined);
    };
  }
}
