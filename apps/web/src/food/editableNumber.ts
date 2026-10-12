import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/** A stored number as it is put back in a field to be edited: whole numbers without a decimal point. */
export function editableNumber(value: number): string {
  const whole = roundHalfAwayFromZero(value) + 0;
  return value === whole ? String(whole) : String(value);
}
