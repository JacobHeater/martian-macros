import { compareStrings } from '../lang/compareStrings';
import type { HealthSample } from './HealthSample';

/** Orders readings oldest first, and by platform id where two share a time. */
export function byStartThenId(a: HealthSample, b: HealthSample): number {
  const byStart = a.start.getTime() - b.start.getTime();
  return byStart !== 0 ? byStart : compareStrings(a.platformId, b.platformId);
}
