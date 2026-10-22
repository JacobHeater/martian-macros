import type { LimbSide } from '../domain/measurements/LimbSide';
import { MeasurementSite } from '../domain/measurements/MeasurementSite';

/** A site as named on screen (MM-156): a limb with the side it is measured on, "Upper arm (left)". */
export function siteLabel(site: MeasurementSite, limbSide?: LimbSide): string {
  const label = MeasurementSite.facts(site).label;
  return MeasurementSite.isLimb(site) && limbSide !== undefined ? `${label} (${limbSide})` : label;
}
