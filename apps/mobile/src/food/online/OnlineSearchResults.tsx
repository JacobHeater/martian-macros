import { useState } from 'react';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import type { PackEntry } from '../../foodCatalog/PackEntry';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { GroupHeader } from '../../ui/GroupHeader';
import { MmButton } from '../../ui/MmButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmSpinner } from '../../ui/MmSpinner';
import { Notice } from '../../ui/Notice';
import { FoodTrustMark } from '../FoodTrustMark';
import { OnlineLookupAsk } from './OnlineLookupAsk';
import '../food.css';

interface OnlineSearchResultsProps {
  query: string;
  onPick: (food: CatalogFood) => void;
}

type Asked =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'searching'; query: string }
  | { kind: 'found'; query: string; entries: PackEntry[] }
  | { kind: 'unavailable'; query: string };

/**
 * Searching the web services for the words typed, on request (MM-58): a
 * "Search online" action under the phone's results, never as the person
 * types, since Open Food Facts asks that search not be used that way. The
 * first time it asks; what is found is listed like the packs' results, with
 * where it came from, and the one picked is kept on the phone.
 */
export function OnlineSearchResults({ query, onPick }: OnlineSearchResultsProps) {
  const { state } = useApp();
  const online = state.onlineLookup;
  useCell(online.choice);
  useCell(online.allowedOnce);
  const [asked, setAsked] = useState<Asked>({ kind: 'idle' });
  const words = query.trim();
  if (!online.available || words === '') return null;
  const current = 'query' in asked && asked.query === words ? asked : asked.kind === 'asking' ? asked : { kind: 'idle' as const };

  const search = async () => {
    setAsked({ kind: 'searching', query: words });
    const result = await online.search(words);
    if (result.kind === 'found') setAsked({ kind: 'found', query: words, entries: result.entries });
    else setAsked({ kind: 'unavailable', query: words });
  };
  const start = () => {
    if (online.allowed) void search();
    else if (online.mustAsk) setAsked({ kind: 'asking' });
  };
  const pick = async (entry: PackEntry) => onPick(await online.keep(entry));

  if (current.kind === 'asking') {
    return (
      <>
        <div className="app-gap-small" />
        <OnlineLookupAsk sent="words" onAllowed={() => void search()} onNever={() => setAsked({ kind: 'idle' })} />
      </>
    );
  }
  if (current.kind === 'searching') {
    return (
      <div className="app-row food-online-searching" role="status">
        <MmSpinner />
        <span>Searching online…</span>
      </div>
    );
  }
  if (current.kind === 'unavailable') {
    return (
      <>
        <div className="app-gap-small" />
        <Notice text="The online food services could not be reached. Try again when you have a connection." />
        <MmButton label="Try again" kind="text" expand onPress={() => void search()} />
      </>
    );
  }
  if (current.kind === 'found') {
    return (
      <>
        <GroupHeader text="Found online" />
        {current.entries.length === 0 ? (
          <p className="app-text food-no-hits">{`Nothing found online for "${words}".`}</p>
        ) : (
          current.entries.map((entry) => (
            <MmListRow
              key={`${entry.food.source}-${entry.food.sourceId ?? entry.food.name}`}
              title={entry.food.brand === undefined ? entry.food.name : `${entry.food.name} · ${entry.food.brand}`}
              detail={
                <>
                  <span>{roundHalfAwayFromZero(entry.food.kcal) + 0} kcal per 100 g</span>
                  <FoodTrustMark food={entry.food} />
                </>
              }
              onPress={() => void pick(entry)}
              opens
            />
          ))
        )}
      </>
    );
  }
  // Nothing asked yet for these words, or the person said never: the offer, unless never.
  if (!online.allowed && !online.mustAsk) return null;
  return <MmButton label="Search online" kind="text" expand onPress={start} />;
}
