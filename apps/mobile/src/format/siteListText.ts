import { MeasurementSite } from '../domain/measurements/MeasurementSite';

/** Sites in a sentence, in their fixed order (MM-156): "hips, upper arm and thigh". */
export function siteListText(sites: Iterable<MeasurementSite>): string {
  const chosen = new Set(sites);
  const names = MeasurementSite.values.filter((site) => chosen.has(site)).map((site) => MeasurementSite.facts(site).label.toLowerCase());
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
