import type { RestSignal } from '../domain/integration/RestSignal';

/** A `RestSignal` that only counts, for tests and the demo. */
export class InMemoryRestSignal implements RestSignal {
  /** How many times a rest was signalled over. */
  signalled = 0;

  restOver(): void {
    this.signalled++;
  }
}
