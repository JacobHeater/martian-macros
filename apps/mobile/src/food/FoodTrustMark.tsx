import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { onlinePackId } from '../foodCatalog/online/onlinePackId';
import { foodSourceLabel } from '../format/foodSourceLabel';
import { trustTierLabel } from '../format/trustTierLabel';
import './food.css';

/**
 * Where a food's numbers came from and how far to trust them (MM-153): the
 * source in words and one quiet tier mark. A "Check this" food also gives
 * its reason, and a food found online says so (MM-58). Nothing here is a
 * score, and nothing is called verified.
 */
export function FoodTrustMark({ food }: { food: CatalogFood }) {
  const doubtful = food.tier === 'checkThis';
  return (
    <span className="food-trust">
      <span>
        {foodSourceLabel(food)} · <span className={doubtful ? 'food-trust-doubtful' : undefined}>{trustTierLabel(food.tier)}</span>
        {food.packId === onlinePackId ? ' · Found online' : null}
      </span>
      {doubtful ? <span>{food.tierReason}</span> : null}
    </span>
  );
}
