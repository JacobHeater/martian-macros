import type { Watched } from '../../src/lang/Watched';

/**
 * A read that goes wrong the first time it is asked and gives `value` every
 * time after: for a "retry" that works. `attempts` says how many times it
 * was asked.
 */
export function failsFirst<T>(value: T): { watch: () => Watched<T>; attempts: () => number } {
  let attempts = 0;
  return {
    attempts: () => attempts,
    watch: () => {
      attempts += 1;
      const failing = attempts === 1;
      return {
        subscribe(listener, onError) {
          if (failing) onError?.(new Error('read failed'));
          else listener(value);
          return () => undefined;
        },
      };
    },
  };
}
