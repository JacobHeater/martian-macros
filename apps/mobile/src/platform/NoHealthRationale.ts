import type { HealthRationale } from '../domain/integration/HealthRationale';

/** Where no health platform links into the app (MM-731): a browser, and an iPhone. */
export class NoHealthRationale implements HealthRationale {
  requested(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
