import type { HealthSample } from './HealthSample';

/**
 * What to call where a reading came from, or undefined when the platform
 * gave no name (MM-395). A package id is never a name: older readings were
 * kept with the id in place of a missing name, so one equal to the id
 * counts as none.
 */
export function healthSourceName(sample: Pick<HealthSample, 'sourceId' | 'sourceName'>): string | undefined {
  const name = sample.sourceName.trim();
  return name === '' || name === sample.sourceId ? undefined : name;
}
