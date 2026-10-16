import type { AppServices } from '../../state/AppServices';
import type { StoryStores } from './StoryStores';

/**
 * The services with one method of one store replaced by `replacement` (a
 * read that never comes back, a write that fails), and every other method
 * of it as the fixtures have it (MM-321).
 */
export function withMethod<K extends keyof AppServices>(
  store: K,
  method: keyof AppServices[K] & string,
  replacement: (...args: never[]) => unknown,
): StoryStores {
  return (services) => {
    const original = services[store] as object;
    const replaced = new Proxy(original, {
      get(target, property, receiver) {
        if (property === method) return replacement;
        const value: unknown = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
      },
    });
    return { ...services, [store]: replaced };
  };
}
