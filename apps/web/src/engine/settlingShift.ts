import type { CalendarDate } from '../domain/CalendarDate';
import { settlingShiftFraction, settlingSlopeShiftFraction } from './coachConstants';
import type { SettlingWindow } from './SettlingWindow';
import { TrendShift } from './TrendShift';

/**
 * For the trend filter: the extra movement allowed on each day of a
 * settling window.
 */
export function settlingShift(
  windows: readonly SettlingWindow[],
  weightKg: number,
): (date: CalendarDate) => TrendShift | undefined {
  const shift = new TrendShift({
    levelSigmaKg: settlingShiftFraction * weightKg,
    slopeSigmaKgPerDay: settlingSlopeShiftFraction * weightKg,
  });
  return (date) => (windows.some((w) => w.contains(date)) ? shift : undefined);
}
