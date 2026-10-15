import type { UnitSystem } from '../UnitSystem';
import { WaterServing } from './WaterServing';

/**
 * The day's water as glasses of the goal (MM-326): the goal over the Add
 * water sheet's glass, rounded up, and what is drunk to the nearest half
 * glass. The last glass fills only once the goal is reached, and past it
 * every glass is full.
 */
export function waterGlasses(totalMl: number, goalMl: number, units: UnitSystem): { drunk: number; of: number } {
  const glassMl = WaterServing.ml('glass', units);
  // A hair under, so a goal of exactly 16 glasses is not 17 after the fl oz conversion.
  const of = Math.max(1, Math.ceil(goalMl / glassMl - 1e-6));
  if (totalMl >= goalMl) return { drunk: of, of };
  return { drunk: Math.min(Math.round((totalMl / glassMl) * 2) / 2, of - 0.5), of };
}
