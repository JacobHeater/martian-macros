import type { CalendarDate } from '../domain/CalendarDate';
import { DietBreakRule } from './DietBreakRule';
import type { TargetFlag } from './TargetFlag';
import type { TargetsRecord } from './TargetsRecord';

/** The flag a break's targets carry: planned by the app, or chosen. */
export type BreakFlag = Extract<TargetFlag, 'dietBreak' | 'requestedBreak'>;

/**
 * The diet break the current targets belong to, while it has not run its
 * length (MM-135): which kind it is and the day it began, counted from the
 * first of the trailing records carrying its flag, so targets reissued
 * inside the break (a corrected profile, an app update) do not restart it.
 * Undefined when the current targets are not a break, or the break is over.
 */
export function breakInForce(
  history: readonly TargetsRecord[],
  today: CalendarDate,
): { flag: BreakFlag; startedOn: CalendarDate } | undefined {
  const inForce = history.filter((record) => !record.effectiveFrom.isAfter(today));
  const current = inForce[inForce.length - 1];
  if (current === undefined) return undefined;
  const flag: BreakFlag | undefined = current.targets.flags.has('requestedBreak')
    ? 'requestedBreak'
    : current.targets.flags.has('dietBreak')
      ? 'dietBreak'
      : undefined;
  if (flag === undefined) return undefined;
  let startedOn = current.effectiveFrom;
  for (let i = inForce.length - 2; i >= 0; i--) {
    const record = inForce[i] as TargetsRecord;
    if (!record.targets.flags.has(flag)) break;
    startedOn = record.effectiveFrom;
  }
  return startedOn.daysUntil(today) < DietBreakRule.breakWeeks * 7 ? { flag, startedOn } : undefined;
}
