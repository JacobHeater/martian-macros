import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfCatalogFood } from './gradeOfCatalogFood';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useAsync } from '../app/useAsync';
import { useDebounced } from '../app/useDebounced';
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

/** How long the typing pauses before the packs are searched again (MM-408). */
const pauseMs = 150;

/**
 * Foods from the installed packs that match `query`, as the user types
 * (MM-42). Searching is on the phone and needs no network. The packs are
 * asked once the typing pauses, and the last answer stays on screen until
 * the next arrives, so the list never empties between keystrokes (MM-408).
 */
export function FoodSearchResults({ query, onPick, alsoFound = false }: FoodSearchResultsProps) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const preview = useInsightPreview();
  const settled = useDebounced(query, pauseMs);
  const hits = useAsync(
    () => (catalog === undefined ? Promise.resolve(undefined) : catalog.search(settled, { limit: 20 })),
    `${catalog?.packs.length ?? -1}:${settled}`,
    { keep: true },
  );
  if (catalog === undefined || hits === undefined) return null;
  if (hits.length === 0) {
    if (alsoFound && catalog.packs.length > 0) return null;
    return (
      <p className="app-text food-no-hits">
        {catalog.packs.length === 0
          ? 'No food database is on this phone yet. You can download one in Settings, under Data, or enter the food yourself.'
          : `Nothing found for "${settled.trim()}".`}
      </p>
    );
  }
  return (
    <>
      {hits.map(({ food }) => {
        // Its grade (MM-370) beside the part that is pressed, so a question mark is a button of its own.
        const grade = preview.gradeOfFood?.(food.name) ?? gradeOfCatalogFood(food);
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
            trailingAction={<FoodGrade grade={grade} subject={food.name} />}
          />
        );
      })}
    </>
  );
}
