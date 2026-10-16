import type { UnitSystem } from '../domain/UnitSystem';
import { WaterServing } from '../domain/water/WaterServing';
import { WaterUnits } from '../domain/water/WaterUnits';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/** A one-tap amount with its size, so the button says what it adds (MM-313): "Glass, 250 ml", "Bottle, 17 fl oz". */
export function waterServingLabel(serving: WaterServing, units: UnitSystem): string {
  const ml = WaterServing.ml(serving, units);
  // No-break spaces, so a narrow button never splits "8 fl oz" across lines.
  const nbsp = ' ';
  const size =
    units === 'imperial'
      ? `${roundHalfAwayFromZero(WaterUnits.mlToFlOz(ml))}${nbsp}fl${nbsp}oz`
      : `${ml}${nbsp}ml`;
  return `${WaterServing.label(serving)}, ${size}`;
}
