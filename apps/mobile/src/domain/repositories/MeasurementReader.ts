import type { Watched } from '../../lang/Watched';
import type { MeasurementSite } from '../measurements/MeasurementSite';
import type { SiteObservation } from '../measurements/SiteObservation';

/** Reads tape measurements, every site's (MM-156); the waist's too. */
export interface MeasurementReader {
  /** `site`'s measurements, oldest first, then the full list after each change. */
  watchSite(site: MeasurementSite): Watched<SiteObservation[]>;

  /** Every site's measurements, oldest first (by day, then in the sites' order), then after each change. */
  watchMeasurements(): Watched<SiteObservation[]>;
}
