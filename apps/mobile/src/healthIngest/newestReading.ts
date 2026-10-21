import { byStartThenId } from './byStartThenId';
import type { HealthSample } from './HealthSample';

/**
 * The reading taken last among `samples`, by when it was taken and then by
 * platform id, or undefined when there is none (MM-68: the height the
 * platform holds now).
 */
export function newestReading(samples: readonly HealthSample[]): HealthSample | undefined {
  return [...samples].sort(byStartThenId).at(-1);
}
