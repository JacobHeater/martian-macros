import { expect } from 'vitest';

/** The one item of `items`; the test fails when there is not exactly one. */
export function only<T>(items: readonly T[]): T {
  expect(items).toHaveLength(1);
  return items[0] as T;
}
