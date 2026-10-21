import type { HealthProfile } from '../../domain/integration/HealthProfile';
import { InMemoryHealthProfile } from '../../fixtures/InMemoryHealthProfile';
import { onIos } from './onIos';
import type { StoryDevice } from './StoryDevice';

/**
 * An iPhone whose Apple Health holds `profile` for onboarding to fill in
 * from (MM-69), nothing where it holds nothing; `unreadable` fails the read.
 */
export function appleHealthProfile(options: { profile?: Partial<HealthProfile>; unreadable?: boolean } = {}): StoryDevice {
  return onIos(async (services) => ({ ...services, healthProfile: new InMemoryHealthProfile(options) }));
}
