import { BreakFlag } from './BreakFlag';
import type { TargetFlag } from './TargetFlag';

/** The diet break a set of targets belongs to, if any (MM-135, MM-432); the person's choice first, as before. */
export function breakFlagOf(flags: ReadonlySet<TargetFlag>): BreakFlag | undefined {
  return BreakFlag.values.find((flag) => flags.has(flag));
}
