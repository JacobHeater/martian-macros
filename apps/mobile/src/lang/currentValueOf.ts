import type { Watched } from './Watched';

/** The value `watched` has now, and no later one; rejected when it cannot be read. */
export function currentValueOf<T>(watched: Watched<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const state: { done: boolean; stop?: () => void } = { done: false };
    const stop = watched.subscribe(
      (value) => {
        if (state.done) return;
        state.done = true;
        resolve(value);
        state.stop?.();
      },
      (error) => {
        if (!state.done) reject(error);
      },
    );
    // A value given at once arrives before there is anything to stop.
    if (state.done) stop();
    else state.stop = stop;
  });
}
