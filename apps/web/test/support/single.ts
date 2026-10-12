import { expect } from 'vitest';

/** The one item of `items`; fails when there is not exactly one. Dart's `.single`. */
export function single<T>(items: readonly T[]): T {
  expect(items.length).toBe(1);
  return items[0] as T;
}
