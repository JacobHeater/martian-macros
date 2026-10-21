import type { BreakFlag } from './BreakFlag';
import { DietBreakRule } from './DietBreakRule';

/**
 * How many days a diet break of this kind runs at maintenance (MM-135,
 * MM-432): one week when the person chose one, otherwise two, so the
 * break the app plans at the cap is two weeks whatever was chosen before.
 */
export function breakLengthDays(flag: BreakFlag): number {
  return (flag === 'requestedOneWeekBreak' ? DietBreakRule.shortBreakWeeks : DietBreakRule.breakWeeks) * 7;
}
