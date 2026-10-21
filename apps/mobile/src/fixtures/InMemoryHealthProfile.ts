import type { HealthProfile } from '../domain/integration/HealthProfile';
import type { HealthProfileReader } from '../domain/integration/HealthProfileReader';
import { HealthReadFailure } from '../healthIngest/HealthReadFailure';

/**
 * Apple Health's answers for onboarding, held in memory (MM-69): what
 * `profile` holds, nothing where it holds nothing, and a failed read when
 * `unreadable`. `asked` counts the reads.
 */
export class InMemoryHealthProfile implements HealthProfileReader {
  readonly offersProfile = true;
  private readonly held: HealthProfile;
  private readonly unreadable: boolean;
  private askedCount = 0;

  constructor({ profile = {}, unreadable = false }: { profile?: Partial<HealthProfile>; unreadable?: boolean } = {}) {
    this.held = { sex: profile.sex, birthDate: profile.birthDate, heightCm: profile.heightCm };
    this.unreadable = unreadable;
  }

  get asked(): number {
    return this.askedCount;
  }

  readProfile(): Promise<HealthProfile> {
    this.askedCount += 1;
    if (this.unreadable) return Promise.reject(new HealthReadFailure('reading the profile'));
    return Promise.resolve(this.held);
  }
}
