import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/**
 * Minutes asleep as hours and minutes (MM-250): "7 h 20 m", "7 h" on the
 * hour, "40 m" under one. Rounded to the minute; never a decimal hour.
 */
export function sleepDurationText(minutes: number): string {
  const whole = Math.max(0, roundHalfAwayFromZero(minutes));
  const hours = Math.trunc(whole / 60);
  const rest = whole - hours * 60;
  if (hours === 0) return `${rest} m`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} m`;
}
