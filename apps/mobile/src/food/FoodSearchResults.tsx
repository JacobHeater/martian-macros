import { useState } from 'react';
import { useInsightPreview } from '../coach/useInsightPreview';
import { gradeOfCatalogFood } from './gradeOfCatalogFood';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import type { SearchHit } from '../foodCatalog/SearchHit';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useApp } from '../app/useApp';
import { useAsync } from '../app/useAsync';
import { useDebounced } from '../app/useDebounced';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmListRow } from '../ui/MmListRow';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { FoodGrade } from './FoodGrade';
import { FoodTrustMark } from './FoodTrustMark';
import { OnlineSearchResults } from './online/OnlineSearchResults';

interface FoodSearchResultsProps {
  query: string;
  onPick: (food: CatalogFood) => void;
  /** Whether the person's own or recent foods already matched above, so an empty pack search says nothing (MM-330). */
  alsoFound?: boolean;
}

/** How long the typing pauses before the packs are searched again (MM-408). */
const pauseMs = 150;

/** How many results a page holds; "More results" asks for the next (MM-410). */
const pageSize = 20;

/**
 * Foods from the installed packs that match `query`, as the user types
 * (MM-42). Searching is on the phone and needs no network. The packs are
 * asked once the typing pauses, and the last answer stays on screen until
 * the next arrives, so the list never empties between keystrokes (MM-408).
 * The first twenty come first; "More results" lengthens the list by twenty
 * while there are more (one more than the page is asked for, so the offer
 * is never empty); the first new row takes focus and a status says how many
 * joined (MM-410).
 */
export function FoodSearchResults({ query, onPick, alsoFound = false }: FoodSearchResultsProps) {
  const { state } = useApp();
  const catalog = useLoaded(state.foodCatalog);
  const preview = useInsightPreview();
  const settled = useDebounced(query, pauseMs);
  // How many pages were asked for, of the query they were asked for: a new query starts at one.
  const [pages, setPages] = useState({ query: settled, count: 1 });
  const count = pages.query === settled ? pages.count : 1;
  const limit = pageSize * count;
  // A read that fails is said, never shown as nothing found (MM-411); Try again asks once more.
  const [attempt, setAttempt] = useState(0);
  const answer = useAsync(
    () =>
      catalog === undefined
        ? Promise.resolve(undefined)
        : catalog
            .search(settled, { limit: limit + 1 })
            .then((found) => ({ found, limit, failed: false, attempt }))
            .catch(() => ({ found: [] as SearchHit[], limit, failed: true, attempt })),
    `${catalog?.packs.length ?? -1}:${settled}:${limit}:${attempt}`,
    { keep: true },
  );
  const hits = answer?.found.slice(0, answer.limit);
  // The row a press added first, once its page has arrived; none on the first page or while it is pending.
  const firstNew = count > 1 && answer?.limit === limit ? limit - pageSize : -1;
  if (catalog === undefined || hits === undefined) return null;
  if (answer?.failed) {
    // Keyed on the attempt, so a repeat failure is announced again; inert while trying (MM-411).
    return (
      <ReadFailedNotice
        key={answer.attempt}
        title="Could not read the food database"
        consequence="Search results are not shown until it can."
        pending={answer.attempt !== attempt}
        onRetry={() => setAttempt((was) => was + 1)}
      />
    );
  }
  if (hits.length === 0) {
    if (alsoFound && catalog.installedPacks.length > 0) return <OnlineSearchResults query={query} onPick={onPick} />;
    return (
      <>
        <p className="app-text food-no-hits">
          {catalog.installedPacks.length === 0
            ? 'No food database is on this phone yet. You can download one in Settings, under Data, or enter the food yourself.'
            : `Nothing found for "${settled.trim()}".`}
        </p>
        <OnlineSearchResults query={query} onPick={onPick} />
      </>
    );
  }
  return (
    <>
      {hits.map(({ food }, at) => {
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
            // A found food goes on to its amount step, where a recent food fills the form in place (MM-219).
            opens
            autoFocus={at === firstNew}
            trailingAction={<FoodGrade grade={grade} subject={food.name} />}
          />
        );
      })}
      {answer !== undefined && firstNew >= 0 ? (
        <span className="mm-visually-hidden" role="status">
          {`${hits.length - firstNew} more results${answer.found.length > answer.limit ? '' : ', every match listed'}.`}
        </span>
      ) : null}
      {answer !== undefined && answer.found.length > answer.limit ? (
        <MmButton label="More results" kind="text" expand onPress={() => setPages({ query: settled, count: answer.limit / pageSize + 1 })} />
      ) : null}
      <OnlineSearchResults query={query} onPick={onPick} />
    </>
  );
}
