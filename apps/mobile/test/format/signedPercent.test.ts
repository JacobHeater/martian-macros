import { expect, it } from 'vitest';
import { signedPercent } from '../../src/format/signedPercent';

/** MM-341: a change as a percent, signed only when it rounds to something. */
it('says no change without a sign, and a change with the app minus sign', () => {
  expect(signedPercent(0.00004)).toBe('0.0%');
  expect(signedPercent(-0.00004)).toBe('0.0%');
  expect(signedPercent(0.012)).toBe('+1.2%');
  expect(signedPercent(-0.012)).toBe('−1.2%');
});
