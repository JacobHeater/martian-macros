import type { InsightArea } from '../domain/InsightArea';
import type { MmIconName } from '../ui/MmIconName';

const icons: Record<InsightArea, MmIconName> = { food: 'food', training: 'train', body: 'body', water: 'water', sleep: 'calendar' };

/** An area's mark: the icon of the place its items are logged (MM-253). */
export function insightAreaIcon(area: InsightArea): MmIconName {
  return icons[area];
}
