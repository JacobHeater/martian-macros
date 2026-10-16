import type { Watched } from '../../lang/Watched';
import type { AppServices } from '../../state/AppServices';
import type { StoryStores } from './StoryStores';
import { withMethod } from './withMethod';

/** A read of `store` that goes wrong, so the screen shows what it says when storage fails (MM-321). */
export function failingRead<K extends keyof AppServices>(store: K, read: keyof AppServices[K] & string): StoryStores {
  const failed: Watched<never> = {
    subscribe: (_listener, onError) => {
      onError?.(new Error(`${String(store)}.${read} failed, as the story asks`));
      return () => undefined;
    },
  };
  return withMethod(store, read, () => failed);
}
