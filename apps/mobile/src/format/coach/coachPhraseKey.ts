import type { CoachFinding } from '../../engine/analysis/CoachFinding';

/**
 * What picks a finding's phrasings (MM-617): its id and its last day, so a
 * day reads the same each time it is opened, and tomorrow's like finding
 * may read another. `part` tells apart two uses of one slot in a finding.
 */
export function coachPhraseKey(f: Pick<CoachFinding, 'id' | 'to'>, part?: number | string): string {
  return part === undefined || part === 0 ? `${f.id}|${f.to.epochDay}` : `${f.id}|${f.to.epochDay}|${part}`;
}
