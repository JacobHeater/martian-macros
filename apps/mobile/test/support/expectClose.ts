import { expect } from 'vitest';

/**
 * Passes when `actual` is within `delta` of `expected`. The same check as
 * the `closeTo` of the Dart tests these were carried over from.
 */
export function expectClose(actual: number | undefined, expected: number, delta: number): void {
  expect(actual).toBeTypeOf('number');
  expect(Math.abs((actual as number) - expected), `${actual} is not within ${delta} of ${expected}`).toBeLessThanOrEqual(
    delta,
  );
}
