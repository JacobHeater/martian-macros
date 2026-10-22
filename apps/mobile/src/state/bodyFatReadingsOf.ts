import type { BodyFatObservation } from '../domain/BodyFatObservation';
import { CalendarDate } from '../domain/CalendarDate';
import type { HealthSample } from '../healthIngest/HealthSample';

/**
 * The body-fat readings read from the health platform, as the body-fat
 * range takes them (MM-502): each on the day it was taken, from the scale
 * that wrote it, so each scale's bias is its own. A smart scale's reading
 * is bioimpedance.
 */
export function bodyFatReadingsOf(samples: readonly HealthSample[]): BodyFatObservation[] {
  return samples
    .filter((sample) => sample.type === 'bodyFat')
    .map((sample) => ({
      date: CalendarDate.fromDate(sample.start),
      percent: sample.value,
      method: 'bia' as const,
      deviceId: sample.sourceId,
    }));
}
