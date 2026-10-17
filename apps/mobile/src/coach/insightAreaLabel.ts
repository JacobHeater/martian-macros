import type { InsightArea } from '../domain/InsightArea';

const labels: Record<InsightArea, string> = { food: 'Food', training: 'Training', body: 'Body', water: 'Water', sleep: 'Sleep' };

/** An area's name as Settings > Coach and the Coach tab say it. */
export function insightAreaLabel(area: InsightArea): string {
  return labels[area];
}
