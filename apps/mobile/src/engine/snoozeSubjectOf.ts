import type { InlineInsightLogEntry } from './InlineInsightLogEntry';

/**
 * The item a logged inline insight's snooze is quiet on (MM-378), as
 * `ItemInsight.subject` names it: an exercise's id, read from its anchor;
 * otherwise the item's name as it was logged.
 */
export function snoozeSubjectOf(entry: Pick<InlineInsightLogEntry, 'anchor' | 'item'>): string {
  if (entry.anchor.kind === 'exercise') return entry.anchor.id.slice(entry.anchor.id.indexOf(':') + 1);
  return entry.item;
}
