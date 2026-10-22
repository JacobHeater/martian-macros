import { Units } from '../domain/Units';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/** A height as Settings shows it: feet and inches (5′ 11″), or whole centimetres (180 cm). */
export function heightLabel(heightCm: number, imperial: boolean): string {
  if (!imperial) return `${roundHalfAwayFromZero(heightCm) + 0} cm`;
  const inches = Units.cmToInches(heightCm);
  return `${Math.trunc(inches / 12)}′ ${roundHalfAwayFromZero(inches % 12) + 0}″`;
}
