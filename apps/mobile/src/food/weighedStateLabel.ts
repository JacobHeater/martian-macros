import type { CatalogFood } from '../foodCatalog/CatalogFood';

/** What a food is when it is weighed: cooked, dry or raw (MM-151). */
export function weighedStateLabel(food: CatalogFood): string {
  if (food.preparation === 'cooked') return 'Cooked';
  if (food.preparation === 'raw') return food.name.toLowerCase().includes(', dry') ? 'Dry' : 'Raw';
  return 'As listed';
}
