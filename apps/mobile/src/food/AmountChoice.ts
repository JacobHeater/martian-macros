import type { PortionUnit } from '../domain/food/portion/PortionUnit';
import type { CatalogServing } from '../foodCatalog/CatalogServing';

/** A way of stating the amount of a database food: one of its servings, or a weight (MM-167). */
export interface AmountChoice {
  readonly unit: PortionUnit;
  readonly serving: CatalogServing | undefined;
}
