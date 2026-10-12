import type { HealthSample } from './HealthSample';

/** Whether two readings are the same in every field (MM-67). */
export function sameHealthSample(a: HealthSample, b: HealthSample): boolean {
  return (
    a.platformId === b.platformId &&
    a.type === b.type &&
    a.value === b.value &&
    a.start.getTime() === b.start.getTime() &&
    a.end?.getTime() === b.end?.getTime() &&
    a.sourceId === b.sourceId &&
    a.sourceName === b.sourceName
  );
}
