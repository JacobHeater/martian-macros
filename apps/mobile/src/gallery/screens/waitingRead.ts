import type { AppServices } from '../../state/AppServices';
import type { StoryStores } from './StoryStores';
import { withMethod } from './withMethod';

/** A read of `store` that never comes back, so the screen stays on its loading state (MM-321). */
export function waitingRead<K extends keyof AppServices>(store: K, read: keyof AppServices[K] & string): StoryStores {
  return withMethod(store, read, () => ({ subscribe: () => () => undefined }));
}
