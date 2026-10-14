import type { Watched } from '../../src/lang/Watched';

/**
 * A read that goes wrong every time it is asked until `recover` is called,
 * and gives `value` every time after: for a "retry" that works. `attempts`
 * says how many times it was asked. Failing until told to recover, rather
 * than once, means a screen that reads the same source earlier (the
 * Dashboard's rows, MM-254) cannot use up the failure before the screen
 * under test sees it.
 */
export function failsFirst<T>(value: T): { watch: () => Watched<T>; attempts: () => number; recover: () => void } {
  let attempts = 0;
  let recovered = false;
  return {
    attempts: () => attempts,
    recover: () => {
      recovered = true;
    },
    watch: () => {
      attempts += 1;
      const failing = !recovered;
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
