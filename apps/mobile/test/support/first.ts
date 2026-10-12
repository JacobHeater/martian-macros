import type { Watched } from '../../src/lang/Watched';

/** The value `watched` gives first: what it holds now. Dart's `stream.first`. */
export function first<T>(watched: Watched<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let stop: (() => void) | undefined;
    let done = false;
    stop = watched.subscribe((value) => {
      if (done) return;
      done = true;
      resolve(value);
      // A value given during `subscribe` arrives before there is anything to stop.
      queueMicrotask(() => stop?.());
    }, reject);
  });
}
