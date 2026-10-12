import { expect, it } from 'vitest';
import type { ModeReason } from '../../src/engine/ModeReason';
import { modeReasonExplanation } from '../../src/format/modeReasonExplanation';

/** MM-132: a recommendation that rests on body fat admits it is an estimate. From mode_reason_estimate_test.dart. */
it('every reason that depends on body fat says it is an estimate', () => {
  const reasons: readonly ModeReason[] = ['highBodyFat', 'recompEligible', 'leanAndTrained', 'cutFirst'];
  for (const reason of reasons) expect(modeReasonExplanation(reason), reason).toContain('estimate');
});

it('reasons that do not depend on body fat are left alone', () => {
  expect(modeReasonExplanation('deficitNotAllowed')).not.toContain('estimate');
  expect(modeReasonExplanation('underweight')).not.toContain('estimate');
});
