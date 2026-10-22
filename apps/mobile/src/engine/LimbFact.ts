import type { MeasurementSite } from '../domain/measurements/MeasurementSite';
import type { WaistChange } from './WaistChange';

/**
 * A limb's change over a period beside the waist's (MM-156): two facts,
 * never a statement about what tissue changed (MM-133, MM-144).
 */
export interface LimbFact {
  readonly site: MeasurementSite;
  readonly days: number;
  readonly limb: WaistChange;
  /** Undefined when the waist has no measurement at both ends. */
  readonly waist: WaistChange | undefined;
}
