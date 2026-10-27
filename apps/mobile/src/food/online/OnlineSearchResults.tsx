import { useState } from 'react';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import type { PackEntry } from '../../foodCatalog/PackEntry';
import { onlineLookupOffText } from '../../format/onlineLookupOffText';
import { onlineUnreachableText } from '../../format/onlineUnreachableText';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { useApp } from '../../app/useApp';
import { useCell } from '../../app/useCell';
import { useInsightPreview } from '../../coach/useInsightPreview';
import { MmButton } from '../../ui/MmButton';
import { MmListRow } from '../../ui/MmListRow';
import { MmSpinner } from '../../ui/MmSpinner';
import { Notice } from '../../ui/Notice';
import { FoodGrade } from '../FoodGrade';
import { FoodTrustMark } from '../FoodTrustMark';
import { gradeOfCatalogFood } from '../gradeOfCatalogFood';
import { OnlineLookupAsk } from './OnlineLookupAsk';
import { per100Label } from '../../format/per100Label';
import '../food.css';

interface OnlineSearchResultsProps {
  query: string;
  onPick: (food: CatalogFood) => void;
}

type Asked =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'declined' }
  | { kind: 'searching'; query: string }
  | { kind: 'found'; query: string; entries: PackEntry[] }
  | { kind: 'unavailable'; query: string };

/**
 * Searching the web services for the words typed, on request (MM-58): a
 * "Search online" action under the phone's results, never as the person
 * types, since Open Food Facts asks that search not be used that way. The
 * first time it asks; what is found is listed like the packs' results, with
 * where each came from and its grade, and the one picked is kept on the
 * phone. The action stays in place, off, while the question or the search
 * is under way, so focus is never dropped (the panel's F4); one status
 * region, there from the start, says what each search came to (F8).
 */
export function OnlineSearchResults({ query, onPick }: OnlineSearchResultsProps) {
  const { state } = useApp();
  const online = state.onlineLookup;
  const preview = useInsightPreview();
  useCell(online.choice);
  useCell(online.allowedOnce);
  const [asked, setAsked] = useState<Asked>({ kind: 'idle' });
  const words = query.trim();
  if (!online.available || words === '') return null;
  const current: Asked = 'query' in asked ? (asked.query === words ? asked : { kind: 'idle' }) : asked;

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

  const status =
    current.kind === 'searching'
      ? 'Searching online…'
      : current.kind === 'found'
        ? current.entries.length === 0
          ? `Nothing found online for "${words}".`
          : `${current.entries.length} found online.`
        : current.kind === 'unavailable'
          ? onlineUnreachableText
          : current.kind === 'declined'
            ? onlineLookupOffText
            : '';
  const offered = online.allowed || online.mustAsk;
  const busy = current.kind === 'asking' || current.kind === 'searching';
  return (
    <>
      {offered && current.kind !== 'found' && current.kind !== 'unavailable' ? (
        <MmButton label="Search online" kind="text" expand onPress={busy ? undefined : start} />
      ) : null}
      {/* A status region that exists before its text, so what a search came to is announced without moving focus (MM-351). */}
      <div role="status" aria-live="polite" className={current.kind === 'searching' ? 'app-row food-online-searching' : undefined}>
        {current.kind === 'searching' ? <MmSpinner /> : null}
        {current.kind === 'found' && current.entries.length > 0 ? <span className="mm-visually-hidden">{status}</span> : null}
        {current.kind === 'searching' || (current.kind === 'found' && current.entries.length === 0) ? (
          <span className={current.kind === 'found' ? 'app-text food-no-hits' : undefined}>{status}</span>
        ) : null}
        {current.kind === 'unavailable' || current.kind === 'declined' ? <Notice text={status} /> : null}
      </div>
      {current.kind === 'asking' ? (
        <>
          <div className="app-gap-small" />
          <OnlineLookupAsk sent="words" onAllowed={() => void search()} onNever={() => setAsked({ kind: 'declined' })} />
        </>
      ) : null}
      {current.kind === 'unavailable' ? (
        <>
          <div className="app-gap-small" />
          <MmButton label="Try again" kind="secondary" expand onPress={() => void search()} />
        </>
      ) : null}
      {current.kind === 'found' && current.entries.length > 0 ? (
        <>
          <p className="food-label food-label-spaced">Found online</p>
          {current.entries.map((entry) => {
            const grade = preview.gradeOfFood?.(entry.food.name) ?? gradeOfCatalogFood(entry.food);
            return (
              <MmListRow
                key={`${entry.food.source}-${entry.food.sourceId ?? entry.food.name}`}
                title={entry.food.brand === undefined ? entry.food.name : `${entry.food.name} · ${entry.food.brand}`}
                detail={
                  <>
                    <span>{`${roundHalfAwayFromZero(entry.food.kcal) + 0} kcal ${per100Label(entry.food.basis)}`}</span>
                    <FoodTrustMark food={entry.food} />
                  </>
                }
                onPress={() => void pick(entry)}
                opens
                trailingAction={<FoodGrade grade={grade} subject={entry.food.name} />}
              />
            );
          })}
        </>
      ) : null}
    </>
  );
}
