import { roundHalfAwayFromZero } from '../../../lang/roundHalfAwayFromZero';

/** The nearest 50 kcal. */
export function roundTo50(kcal: number): number {
  return roundHalfAwayFromZero(kcal / 50) * 50;
}
