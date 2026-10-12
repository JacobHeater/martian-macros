import type { FoodOrigin } from './FoodOrigin';

/** Whether two origins name the same food from the same source (MM-167). */
export function sameFoodOrigin(a: FoodOrigin, b: FoodOrigin): boolean {
  return a.packId === b.packId && a.foodId === b.foodId && a.source === b.source && a.sourceId === b.sourceId;
}
