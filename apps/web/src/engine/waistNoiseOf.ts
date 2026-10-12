import type { WaistObservation } from '../domain/WaistObservation';
import { WaistRule } from './WaistRule';

/**
 * The noise figure for one waist measurement made as the middle of three
 * readings (MM-155): 1.0 cm to begin with. Once `WaistRule.personalAfter`
 * entries carry their three readings it is this user's own: the typical
 * spread of their readings within one sitting, never under 0.5 cm.
 *
 * An entry of one reading is noisier still; see
 * `WaistRule.singleReadingFactor`.
 */
export function waistNoiseOf(waist: Iterable<WaistObservation>): number {
  const spreads: number[] = [];
  for (const entry of waist) {
    if (entry.readings.length === 3) {
      spreads.push(Math.max(...entry.readings) - Math.min(...entry.readings));
    }
  }
  spreads.sort((a, b) => a - b);
  if (spreads.length < WaistRule.personalAfter) {
    return WaistRule.medianOfThreeNoiseCm;
  }
  const mid = Math.trunc(spreads.length / 2);
  const typical =
    spreads.length % 2 === 1
      ? (spreads[mid] as number)
      : ((spreads[mid - 1] as number) + (spreads[mid] as number)) / 2;
  return typical < WaistRule.personalFloorCm ? WaistRule.personalFloorCm : typical;
}
