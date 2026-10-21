import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { weighedStateLabel } from './weighedStateLabel';

const n = (value: number) => `${roundHalfAwayFromZero(value) + 0}`;

/**
 * The size of the difference between a weight of one state and of its pair,
 * which is the education (MM-151): "200 g cooked is about 260 kcal. 200 g
 * raw is about 730 kcal."
 */
export function weighedConsequence(weighed: number, chosen: CatalogFood, other: CatalogFood): string {
  const line = (f: CatalogFood) =>
    `${n(weighed)} g ${weighedStateLabel(f).toLowerCase()} is about ${n((f.kcal * weighed) / 100)} kcal`;
  return `${line(chosen)}. ${line(other)}.`;
}
