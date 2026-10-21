import type { ExternalLinks } from '../domain/integration/ExternalLinks';
import { httpsAddress } from '../domain/integration/httpsAddress';
import type { MmOpenInBrowserApi } from './MmOpenInBrowserApi';

/**
 * `ExternalLinks` through the shell (MM-454): `MmBackup.openInBrowser`, an
 * `ACTION_VIEW` intent on Android and `UIApplication.open` on iOS. The
 * address is checked here first, and the plugin checks it again.
 */
export class NativeExternalLinks implements ExternalLinks {
  private readonly api: MmOpenInBrowserApi;

  constructor(api: MmOpenInBrowserApi) {
    this.api = api;
  }

  async openInBrowser(address: string): Promise<void> {
    await this.api.openInBrowser({ url: httpsAddress(address) });
  }
}
