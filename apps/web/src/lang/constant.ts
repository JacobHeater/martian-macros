import type { Watched } from './Watched';

/** A value that never changes, as something that can be watched. */
export function constant<T>(value: T): Watched<T> {
  return {
    subscribe(listener) {
      listener(value);
      return () => undefined;
    },
  };
}
