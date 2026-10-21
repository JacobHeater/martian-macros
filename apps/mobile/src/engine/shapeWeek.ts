import { WeekShape } from '../domain/WeekShape';
import type { ShapedWeek } from './ShapedWeek';

/**
 * The calories of a shaped week's higher and lower days (MM-124). Higher
 * days are `week.raise` above the flat figure, the other days lowered
 * equally, so the week totals seven flat days. No lower day goes under the
 * calorie floor or more than `WeekShape.maxLowering` under the flat figure:
 * if the shape asks for that, the higher days come down until it fits.
 */
export function shapeWeek({ flatKcal, floorKcal, week }: { flatKcal: number; floorKcal: number; week: WeekShape }): ShapedWeek {
  const higher = week.higherDays.size;
  if (higher === 0) return { higherKcal: flatKcal, lowerKcal: flatKcal, reducedBy: undefined };
  const lower = 7 - higher;
  const askedLowerKcal = flatKcal * (1 - (higher * week.raise) / lower);
  const loweringLimitKcal = (1 - WeekShape.maxLowering) * flatKcal;
  const lowestKcal = Math.max(floorKcal, loweringLimitKcal);
  if (askedLowerKcal >= lowestKcal) {
    return { higherKcal: flatKcal * (1 + week.raise), lowerKcal: askedLowerKcal, reducedBy: undefined };
  }
  // A flat figure already at the floor leaves nothing to move.
  const lowerKcal = Math.min(flatKcal, lowestKcal);
  return {
    higherKcal: flatKcal + (lower * (flatKcal - lowerKcal)) / higher,
    lowerKcal,
    reducedBy: floorKcal >= loweringLimitKcal ? 'floor' : 'lowering',
  };
}
