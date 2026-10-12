import type { Watched } from '../../src/lang/Watched';

/** A store that has not answered yet, and never does. */
export function never<T>(): Watched<T> {
  return { subscribe: () => () => undefined };
}
