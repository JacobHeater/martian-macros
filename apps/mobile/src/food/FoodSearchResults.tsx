import { useInsightPreview } from '../coach/useInsightPreview';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useAsync } from '../app/useAsync';
import { useLoaded } from '../app/useLoaded';
import { MmListRow } from '../ui/MmListRow';
import { FoodGrade } from './FoodGrade';
import { FoodTrustMark } from './FoodTrustMark';

interface FoodSearchResultsProps {
  query: string;
  onPick: (food: CatalogFood) => void;
  /** Whether the person's own or recent foods already matched above, so an empty pack search says nothing (MM-330). */
  alsoFound?: boolean;
}

/**
 * Foods from the installed packs that match `query`, as the user types
 * (MM-42). Searching is on the phone and needs no network.
 */
export function FoodSearchResults({ query, onPick, alsoFound = false }: FoodSearchResultsProps) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const preview = useInsightPreview();
  const hits = useAsync(
    () => (catalog === undefined ? Promise.resolve(undefined) : catalog.search(query, { limit: 20 })),
    `${catalog?.packs.length ?? -1}:${query}`,
  );
  if (catalog === undefined || hits === undefined) return null;
  if (hits.length === 0) {
    if (alsoFound && catalog.packs.length > 0) return null;
    return (
      <p className="app-text food-no-hits">
        {catalog.packs.length === 0
          ? 'No food database is on this phone yet. You can download one in Settings, or enter the food yourself.'
          : `Nothing found for "${query.trim()}".`}
      </p>
    );
  }
  return (
    <>
      {hits.map(({ food }) => {
        // Its grade (MM-370) beside the part that is pressed, so a question mark is a button of its own.
        const grade = preview.gradeOfFood?.(food.name);
        return (
          <MmListRow
            key={`${food.packId}-${food.id}`}
            title={food.brand === undefined ? food.name : `${food.name} · ${food.brand}`}
            detail={
              <>
                <span>{roundHalfAwayFromZero(food.kcal) + 0} kcal per 100 g</span>
                <FoodTrustMark food={food} />
              </>
            }
            onPress={() => onPick(food)}
            trailingAction={grade === undefined ? undefined : <FoodGrade grade={grade} subject={food.name} />}
          />
        );
      })}
    </>
  );
}
