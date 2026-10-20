import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/**
 * Minutes as the hours and minutes a person types (MM-250): rounded to the
 * minute first, then split, so 419.6 minutes is "7" and "0", never "6" and
 * "60" (MM-415). Empty fields for no value.
 */
export function durationFieldsOf(minutes: number | undefined): { hours: string; minutes: string } {
  if (minutes === undefined) return { hours: '', minutes: '' };
  const whole = Math.max(0, roundHalfAwayFromZero(minutes));
  const hours = Math.trunc(whole / 60);
  return { hours: `${hours}`, minutes: `${whole - hours * 60}` };
}
