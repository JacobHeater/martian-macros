import type { BiologicalSex } from '../domain/BiologicalSex';
import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';

/**
 * What the fiber insight needs (MM-126): who the guide is for, each day's
 * entries over the period, and the recovery check-ins (MM-116). Absent
 * below Full detail, where fiber is not shown.
 */
export interface FiberPattern {
  readonly sex: BiologicalSex;
  readonly days: ReadonlyMap<CalendarDate, readonly FoodEntry[]>;
  readonly checkIns: readonly RecoveryCheckIn[];
}
