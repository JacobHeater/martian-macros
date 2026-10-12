import { expect } from 'vitest';
import type { Watched } from '../../src/lang/Watched';

/**
 * Subscribes to `watched`, waits for its first value (which, seen through
 * `see`, must equal `before`), runs `change`, and expects it to then give
 * `after`.
 *
 * Waiting for the first value matters: a database may run its first query
 * after a write issued straight after subscribing, so "the current value
 * first" can only be checked once that value has arrived.
 */
export async function expectChangeEmits<T, V = T>(
  watched: Watched<T>,
  {
    see = (value: T) => value as unknown as V,
    before,
    change,
    after,
  }: { see?: (value: T) => V; before: V; change: () => Promise<unknown>; after: V },
): Promise<void> {
  const seen: V[] = [];
  let arrived: () => void = () => {};
  const firstValue = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  const stop = watched.subscribe((value) => {
    seen.push(see(value));
    arrived();
  });
  try {
    await Promise.race([
      firstValue,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Nothing was given in 5 seconds.')), 5000)),
    ]);
    expect(seen[0], 'the first value is the current one').toEqual(before);
    await change();
    for (let i = 0; i < 100 && (seen.length < 2 || !Object.is(seen[seen.length - 1], after)); i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    stop();
  }
  expect(seen[seen.length - 1], 'a change is given').toEqual(after);
}
