import type { CalendarDate } from './CalendarDate';
import type { CarbFatBalance } from './CarbFatBalance';
import { WeekShape } from './WeekShape';

/**
 * How the user shapes their targets from `since` on (MM-122, MM-124): the
 * balance of carbohydrate and fat, and the week's higher days. Kept by the
 * day it was set, so a day before a change is compared with the target it
 * had at the time.
 */
export class TargetShape {
  readonly since: CalendarDate;

  /** Undefined: the split MM-24 sets (fat the larger of its minimum and 25% of calories). */
  readonly balance: CarbFatBalance | undefined;
  readonly week: WeekShape;

  constructor({ since, balance, week = WeekShape.flat }: { since: CalendarDate; balance?: CarbFatBalance | undefined; week?: WeekShape | undefined }) {
    this.since = since;
    this.balance = balance;
    this.week = week;
  }

  /** The shape in force on `day` among `shapes` (oldest first); undefined before the first. */
  static on(shapes: readonly TargetShape[], day: CalendarDate): TargetShape | undefined {
    let found: TargetShape | undefined;
    for (const shape of shapes) {
      if (shape.since.isAfter(day)) break;
      found = shape;
    }
    return found;
  }
}
