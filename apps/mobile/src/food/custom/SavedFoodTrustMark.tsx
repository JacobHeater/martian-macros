import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { foodEvidenceLine } from '../../format/foodEvidenceLine';
import '../food.css';

/**
 * Where a saved food's numbers came from (MM-710), as `FoodTrustMark` says
 * it for a catalog food (MM-153): "Your food", then the evidence in words.
 * An unverified estimate stands out, as a "Check this" food does. A food
 * saved before its evidence was kept says only that it is the person's.
 */
export function SavedFoodTrustMark({ food }: { food: CustomFood }) {
  const evidence = food.evidence;
  const doubtful = evidence?.kind === 'estimated';
  return (
    <span className="food-trust">
      <span>
        {food.kind === 'recipe' ? 'Your recipe' : 'Your food'}
        {evidence === undefined ? null : (
          <>
            {' · '}
            <span className={doubtful ? 'food-trust-doubtful' : undefined}>{foodEvidenceLine(evidence)}</span>
          </>
        )}
      </span>
    </span>
  );
}
