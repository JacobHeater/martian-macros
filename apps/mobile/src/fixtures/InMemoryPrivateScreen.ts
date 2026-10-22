import type { PrivateScreen } from '../domain/integration/PrivateScreen';

/** A private screen in memory (MM-157): whether the screen is hidden now. */
export class InMemoryPrivateScreen implements PrivateScreen {
  hiders = 0;

  get hidden(): boolean {
    return this.hiders > 0;
  }

  hide(): () => void {
    this.hiders++;
    let shown = false;
    return () => {
      if (shown) return;
      shown = true;
      this.hiders--;
    };
  }
}
