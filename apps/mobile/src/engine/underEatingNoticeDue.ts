import type { CalendarDate } from '../domain/CalendarDate';
import { UnderEatingRule } from './UnderEatingRule';

/**
 * Whether the notice for a finding shows on `today`, given the day it was
 * last dismissed: not again within `UnderEatingRule.quietDays`.
 */
export function underEatingNoticeDue({
  today,
  dismissedOn,
}: {
  today: CalendarDate;
  dismissedOn: CalendarDate | undefined;
}): boolean {
  return dismissedOn === undefined || dismissedOn.daysUntil(today) >= UnderEatingRule.quietDays;
}
