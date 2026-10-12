import type { Watched } from '../../lang/Watched';

/** What `watched` holds now. */
export function valueOf<T>(watched: Watched<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let done = false;
    const stop = watched.subscribe((value) => {
      if (done) return;
      done = true;
      resolve(value);
      // A value given during `subscribe` arrives before there is anything to stop.
      queueMicrotask(() => stop());
    }, reject);
  });
}
