import type { HealthProfile } from './HealthProfile';

/**
 * Fills in onboarding's first answers from the phone's health platform
 * (MM-69). Only Apple Health can: Health Connect keeps no sex or date of
 * birth. What is read only fills a question; the person still answers it.
 */
export interface HealthProfileReader {
  /** Whether onboarding offers to fill in from the platform on this phone. */
  readonly offersProfile: boolean;

  /**
   * Asks to read sex, date of birth and height (the platform shows its own
   * sheet the first time), then answers what it holds. Nothing held, or
   * reading refused, is an empty profile: Apple Health never says which.
   * Rejects with `HealthReadFailure` when the platform cannot be read.
   */
  readProfile(): Promise<HealthProfile>;
}
