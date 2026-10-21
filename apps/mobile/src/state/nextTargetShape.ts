import type { CalendarDate } from '../domain/CalendarDate';
import type { CarbFatBalance } from '../domain/CarbFatBalance';
import { TargetShape } from '../domain/TargetShape';
import type { WeekShape } from '../domain/WeekShape';

/**
 * The shape to save when the user changes one part of it today (MM-122,
 * MM-124): the one in force today with that part changed, from today on.
 * Days before today keep the shape they had.
 */
export function nextTargetShape({
  shapes,
  today,
  balance,
  week,
}: {
  shapes: readonly TargetShape[];
  today: CalendarDate;
  balance?: CarbFatBalance;
  week?: WeekShape;
}): TargetShape {
  const now = TargetShape.on(shapes, today);
  return new TargetShape({ since: today, balance: balance ?? now?.balance, week: week ?? now?.week });
}
