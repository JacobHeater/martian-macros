import type { UnitSystem } from '../domain/UnitSystem';
import { WaterUnits } from '../domain/water/WaterUnits';
import { groupThousands } from '../lang/groupThousands';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

/** A volume of water (MM-313): litres to at most two decimals in metric ("1.25 L", "2.5 L"), whole fluid ounces in imperial ("42 fl oz"). */
export function waterAmount(ml: number, units: UnitSystem): string {
  if (units === 'imperial') return `${groupThousands(roundHalfAwayFromZero(WaterUnits.mlToFlOz(ml)) + 0)} fl oz`;
  return `${toStringAsFixed(ml / 1000, 2).replace(/\.?0+$/, '')} L`;
}
