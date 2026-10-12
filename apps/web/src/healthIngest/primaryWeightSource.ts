import { compareStrings } from '../lang/compareStrings';
import type { HealthSample } from './HealthSample';

const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

/**
 * The scale whose readings count first (MM-71): the source with the most
 * weigh-ins in the thirty days up to `asOf`, or undefined with none. A tie
 * goes to the source id that sorts first, so the answer never depends on
 * the order of `samples`.
 */
export function primaryWeightSource(samples: Iterable<HealthSample>, { asOf }: { asOf: Date }): string | undefined {
  const from = asOf.getTime() - thirtyDaysMs;
  const counts = new Map<string, number>();
  for (const sample of samples) {
    if (sample.type !== 'weight') continue;
    const at = sample.start.getTime();
    if (at < from || at > asOf.getTime()) continue;
    counts.set(sample.sourceId, (counts.get(sample.sourceId) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const id of [...counts.keys()].sort(compareStrings)) {
    const count = counts.get(id) ?? 0;
    if (best === undefined || count > bestCount) {
      best = id;
      bestCount = count;
    }
  }
  return best;
}
