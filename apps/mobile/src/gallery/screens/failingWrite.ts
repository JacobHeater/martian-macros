import type { AppServices } from '../../state/AppServices';
import type { StoryStores } from './StoryStores';
import { withMethod } from './withMethod';

/** A write to `store` that fails, so the screen shows what it says when saving goes wrong (MM-321). */
export function failingWrite<K extends keyof AppServices>(store: K, write: keyof AppServices[K] & string): StoryStores {
  return withMethod(store, write, () => Promise.reject(new Error(`${String(store)}.${write} failed, as the story asks`)));
}
