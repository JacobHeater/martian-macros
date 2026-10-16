import type { Watched } from '../../lang/Watched';
import type { AppServices } from '../../state/AppServices';
import type { StoryStores } from './StoryStores';

/**
 * The services with one read of one store replaced by `watched`, and every
 * other read of it as the fixtures have it (MM-321).
 */
export function withRead<K extends keyof AppServices>(store: K, read: keyof AppServices[K] & string, watched: () => Watched<never>): StoryStores {
  return (services) => {
    const original = services[store] as object;
    const replaced = new Proxy(original, {
      get(target, property, receiver) {
        if (property === read) return watched;
        const value: unknown = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
      },
    });
    return { ...services, [store]: replaced };
  };
}
