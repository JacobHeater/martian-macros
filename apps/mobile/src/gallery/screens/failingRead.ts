import type { AppServices } from '../../state/AppServices';
import type { StoryStores } from './StoryStores';
import { withRead } from './withRead';

/** A read of `store` that goes wrong, so the screen shows what it says when storage fails (MM-321). */
export function failingRead<K extends keyof AppServices>(store: K, read: keyof AppServices[K] & string): StoryStores {
  return withRead(store, read, () => ({
    subscribe: (_listener, onError) => {
      onError?.(new Error(`${String(store)}.${read} failed, as the story asks`));
      return () => undefined;
    },
  }));
}
