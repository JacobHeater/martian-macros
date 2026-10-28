import type { Haptics } from '../domain/integration/Haptics';

/** `Haptics` that only count their taps, for tests and stories (MM-661). */
export class InMemoryHaptics implements Haptics {
  taps = 0;

  tap(): void {
    this.taps += 1;
  }
}
