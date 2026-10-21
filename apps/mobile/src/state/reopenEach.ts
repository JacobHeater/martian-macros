import type { Watched } from '../lang/Watched';

const ignore = () => undefined;

/**
 * What `load` gives, opened afresh for each subscription, as something that
 * can be watched, with everything it opens closed again (MM-386).
 *
 * A value given to a subscriber is closed once nobody can read it any more:
 * when its subscriber stops and no later subscription follows, or, when one
 * does (a stream asking again), as soon as the later one has settled and
 * before its value is given. So a reader never holds a closed value, and
 * at most two are open while a new one loads. A value still loading when its
 * subscriber stops is closed when it settles, never dropped open.
 */
export function reopenEach<T>(load: () => Promise<T>, close: (value: T) => Promise<void>): Watched<T> {
  /** The newest subscription, and whether it has settled. */
  let newest: { settled: boolean } | undefined;
  /** Values whose subscribers stopped, kept open until the newest subscription settles. */
  let retiring: T[] = [];
  const closeQuietly = (value: T) => void close(value).catch(ignore);
  const retireAll = () => {
    const due = retiring;
    retiring = [];
    for (const value of due) closeQuietly(value);
  };

  return {
    subscribe(listener, onError) {
      const mine = { settled: false };
      newest = mine;
      let stopped = false;
      let given: { value: T } | undefined;
      const settle = () => {
        mine.settled = true;
        // The newest has settled: what it replaces is read no more.
        if (newest === mine) retireAll();
      };
      load().then(
        (value) => {
          if (stopped) {
            // Superseded while loading: closed, not dropped with its files open.
            closeQuietly(value);
            settle();
            return;
          }
          given = { value };
          settle();
          listener(value);
        },
        (error: unknown) => {
          settle();
          if (!stopped) onError?.(error);
        },
      );
      return () => {
        if (stopped) return;
        stopped = true;
        if (given === undefined) return; // closed when it settles
        retiring.push(given.value);
        given = undefined;
        // A stream asking again subscribes straight after stopping; wait for that one to settle.
        queueMicrotask(() => {
          if (newest === mine || newest === undefined || newest.settled) retireAll();
        });
      };
    },
  };
}
