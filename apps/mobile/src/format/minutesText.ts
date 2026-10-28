import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/**
 * Minutes of cardio as the screen says them (MM-677): "42 min", and over an
 * hour "1 h 12 min", "2 h" on the hour. Whole minutes, never a decimal
 * hour.
 */
export function minutesText(minutes: number): string {
  const whole = Math.max(0, roundHalfAwayFromZero(minutes));
  const hours = Math.trunc(whole / 60);
  const rest = whole - hours * 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
