import type { Watched } from '../../src/lang/Watched';

/** A store whose read goes wrong. */
export function failing<T>(message = 'unavailable'): Watched<T> {
  return {
    subscribe: (_listener, onError) => {
      onError?.(new Error(message));
      return () => undefined;
    },
  };
}
