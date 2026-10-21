import type { CalendarDate } from '../domain/CalendarDate';
import type { BreakFlag } from './BreakFlag';
import { breakFlagOf } from './breakFlagOf';
import { breakLengthDays } from './breakLengthDays';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The diet break the current targets belong to, while it has not run its
 * length (MM-135): which kind it is and the day it began, counted from the
 * first of the trailing records carrying its flag, so targets reissued
 * inside the break (a corrected profile, an app update) do not restart it.
 * The length is the one that first record carries (MM-432): one week if the
 * person chose one, otherwise two. Undefined when the current targets are
 * not a break, or the break is over.
 */
export function breakInForce(
  history: readonly TargetsRecord[],
  today: CalendarDate,
): { flag: BreakFlag; startedOn: CalendarDate } | undefined {
  const inForce = history.filter((record) => !record.effectiveFrom.isAfter(today));
  const current = inForce[inForce.length - 1];
  if (current === undefined) return undefined;
  const flag = breakFlagOf(current.targets.flags);
  if (flag === undefined) return undefined;
  let startedOn = current.effectiveFrom;
  for (let i = inForce.length - 2; i >= 0; i--) {
    const record = inForce[i] as TargetsRecord;
    if (!record.targets.flags.has(flag)) break;
    startedOn = record.effectiveFrom;
  }
  return startedOn.daysUntil(today) < breakLengthDays(flag) ? { flag, startedOn } : undefined;
}
