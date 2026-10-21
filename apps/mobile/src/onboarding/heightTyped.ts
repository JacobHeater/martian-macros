import { Units } from '../domain/Units';
import type { UnitSystem } from '../domain/UnitSystem';
import type { MeasurementsTyped } from './MeasurementsTyped';

/**
 * A height in centimetres as the measurement fields show it in `units`
 * (MM-69): whole feet and inches, or whole centimetres. The other unit's
 * fields are left empty.
 */
export function heightTyped(heightCm: number, units: UnitSystem): Pick<MeasurementsTyped, 'feet' | 'inches' | 'cm'> {
  if (units === 'metric') return { feet: '', inches: '', cm: String(Math.round(heightCm)) };
  const totalInches = Math.round(Units.cmToInches(heightCm));
  return { feet: String(Math.floor(totalInches / 12)), inches: String(totalInches % 12), cm: '' };
}
