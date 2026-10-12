import type { Watched } from '../../lang/Watched';
import type { WaistObservation } from '../WaistObservation';

/** Reads waist measurements. */
export interface WaistReader {
  /** Every measurement, oldest first, then the full list after each change. */
  watchWaist(): Watched<WaistObservation[]>;
}
