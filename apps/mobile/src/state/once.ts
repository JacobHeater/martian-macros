import type { Watched } from '../lang/Watched';

/** What `load` gives, asked for when it is watched, as something that can be watched. */
export function once<T>(load: () => Promise<T>): Watched<T> {
  return {
    subscribe(listener, onError) {
      let stopped = false;
      load().then(
        (value) => {
          if (!stopped) listener(value);
        },
        (error: unknown) => {
          if (!stopped) onError?.(error);
        },
      );
      return () => {
        stopped = true;
      };
    },
  };
}
