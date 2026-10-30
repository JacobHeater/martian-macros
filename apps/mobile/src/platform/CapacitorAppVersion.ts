import { App } from '@capacitor/app';
import type { AppVersionReader } from './AppVersionReader';

/** The version and build the shell was given (MM-697): the store's version, and the build number beside it. */
export class CapacitorAppVersion implements AppVersionReader {
  async read(): Promise<string> {
    const info = await App.getInfo();
    return `${info.version} (${info.build})`;
  }
}
