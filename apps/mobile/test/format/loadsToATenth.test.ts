import { expect, it } from 'vitest';
import type { WorkoutSet } from '../../src/domain';
import { Fmt } from '../../src/format/Fmt';
import { loadNumber } from '../../src/format/loadNumber';
import { setText } from '../../src/format/setText';

/** MM-350: a load is said to a tenth, as a scale says a weight, never "182.98 lb". */
it('a load converted to pounds reads to a tenth', () => {
  const set = { reps: 5, loadKg: 83 } as WorkoutSet;
  expect(setText(set, new Fmt('imperial'), 'addedWeight')).toBe('5 × 183 lb');
});

it('a load reads to a tenth and drops a trailing zero', () => {
  expect(loadNumber(182.98)).toBe('183');
  expect(loadNumber(102.25)).toBe('102.3');
  expect(loadNumber(102.5)).toBe('102.5');
  expect(loadNumber(225)).toBe('225');
});
