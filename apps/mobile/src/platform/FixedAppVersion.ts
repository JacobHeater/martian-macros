import type { AppVersionReader } from './AppVersionReader';

/** A version that is always the one given (MM-697): a browser, which has no shell to ask, and tests. */
export class FixedAppVersion implements AppVersionReader {
  private readonly version: string;

  constructor(version: string) {
    this.version = version;
  }

  async read(): Promise<string> {
    return this.version;
  }
}
