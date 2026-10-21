import type { CalendarDate } from '../domain/CalendarDate';
import { TargetShape } from '../domain/TargetShape';
import { shapeWeek } from './shapeWeek';

/**
 * The share of the flat daily figure the user planned to eat on a day
 * (MM-124): above 1 on a higher day, below 1 on a lower day, 1 on a flat
 * week or before the first shape. The partial-day rule (MM-27) reads each
 * day against its plan, so a planned lower day eaten as planned is never
 * taken for a half-logged one.
 *
 * The calorie floor is left out (the share does not depend on the day's
 * figure): when the floor holds the lower days up, they sit nearer the flat
 * figure than this share says, which only makes them look fuller.
 */
export function plannedDayShare(shapes: readonly TargetShape[]): (date: CalendarDate) => number {
  return (date) => {
    const week = TargetShape.on(shapes, date)?.week;
    if (week === undefined || week.isFlat) return 1;
    const shaped = shapeWeek({ flatKcal: 1, floorKcal: 0, week });
    return week.higherDays.has(date.weekday) ? shaped.higherKcal : shaped.lowerKcal;
  };
}
