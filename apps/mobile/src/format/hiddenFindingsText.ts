import type { HiddenFinding } from '../engine/analysis/HiddenFinding';
import { Fmt } from './Fmt';

/**
 * The fold's line for dismissed findings (MM-610): "1 hidden · shows again
 * Nov 14", or for several, the first to show again. Empty when none is hidden.
 */
export function hiddenFindingsText(hidden: readonly HiddenFinding[]): string {
  const first = hidden[0];
  if (first === undefined) return '';
  const day = Fmt.shortDay(first.showsAgainOn);
  return hidden.length === 1 ? `1 hidden · shows again ${day}` : `${hidden.length} hidden · the first shows again ${day}`;
}
