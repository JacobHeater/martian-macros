import { expect, it } from 'vitest';
import { Fmt } from '../../src/format/Fmt';

/** MM-341: a change in weight is signed only when it rounds to something. */
it('a change that rounds to none has no sign', () => {
  expect(new Fmt('metric').weightDelta(0.01)).toBe('0.0 kg');
  expect(new Fmt('metric').weightDelta(-0.04)).toBe('0.0 kg');
});

it('a change keeps its sign', () => {
  expect(new Fmt('metric').weightDelta(0.3)).toBe('+0.3 kg');
  expect(new Fmt('metric').weightDelta(-0.3)).toBe('−0.3 kg');
});
