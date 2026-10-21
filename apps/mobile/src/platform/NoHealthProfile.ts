import type { HealthProfile } from '../domain/integration/HealthProfile';
import type { HealthProfileReader } from '../domain/integration/HealthProfileReader';

/**
 * Where onboarding cannot be filled in from a health platform (MM-69): a
 * browser, and Android, whose Health Connect keeps no sex or date of birth.
 * Nothing is offered and nothing is read.
 */
export class NoHealthProfile implements HealthProfileReader {
  readonly offersProfile = false;

  readProfile(): Promise<HealthProfile> {
    return Promise.resolve({ sex: undefined, birthDate: undefined, heightCm: undefined });
  }
}
