import type { ExternalLinks } from '../domain/integration/ExternalLinks';
import { httpsAddress } from '../domain/integration/httpsAddress';

/**
 * `ExternalLinks` in a browser, where the app is developed (MM-228, MM-454):
 * a new tab, given no hold on the app. `open` is `window.open` unless a test
 * brings its own.
 */
export class WindowExternalLinks implements ExternalLinks {
  private readonly open: (url: string, target: string, features: string) => unknown;

  constructor(open: (url: string, target: string, features: string) => unknown = (...args) => window.open(...args)) {
    this.open = open;
  }

  async openInBrowser(address: string): Promise<void> {
    const url = httpsAddress(address);
    // With "noopener" a tab that opened answers null too, so only a thrown error is a refusal.
    this.open(url, '_blank', 'noopener,noreferrer');
  }
}
