import type { ExternalLinks } from '../domain/integration/ExternalLinks';
import { httpsAddress } from '../domain/integration/httpsAddress';

/** An `ExternalLinks` that only keeps what it was asked to open, for tests and stories: never the phone's browser (MM-454). */
export class InMemoryExternalLinks implements ExternalLinks {
  /** The addresses opened, in order. */
  readonly opened: string[] = [];

  /** A phone with no browser to open a page in: every open is refused. */
  noBrowser = false;

  async openInBrowser(address: string): Promise<void> {
    const checked = httpsAddress(address);
    if (this.noBrowser) throw new Error('No browser is installed.');
    this.opened.push(checked);
  }
}
