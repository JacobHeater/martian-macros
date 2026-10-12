import type { Watched } from '../../../src/lang/Watched';

/**
 * Watches `watched` until `done` says its value will do, and gives that
 * value. State that is worked out from the store arrives over several
 * turns; this waits for it without sleeping for a guessed time.
 */
export function settled<T>(watched: Watched<T>, done: (value: T) => boolean = () => true): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let stop: (() => void) | undefined;
    let finished = false;
    const timer = setTimeout(() => {
      finished = true;
      stop?.();
      reject(new Error('The state did not settle in 2 seconds.'));
    }, 2000);
    stop = watched.subscribe((value) => {
      if (finished || !done(value)) return;
      finished = true;
      clearTimeout(timer);
      resolve(value);
      queueMicrotask(() => stop?.());
    });
  });
}

/** Lets everything already queued run. */
export const turn = () => new Promise((resolve) => setTimeout(resolve, 0));
