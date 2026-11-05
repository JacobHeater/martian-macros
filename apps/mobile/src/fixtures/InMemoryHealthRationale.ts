import type { HealthRationale } from '../domain/integration/HealthRationale';

/** Whether the health platform sent the person here (MM-731), as a story or a test says; said once. */
export class InMemoryHealthRationale implements HealthRationale {
  private pending: boolean;

  constructor(pending = false) {
    this.pending = pending;
  }

  requested(): Promise<boolean> {
    const requested = this.pending;
    this.pending = false;
    return Promise.resolve(requested);
  }
}
