import { StateError } from '../../lang/StateError';
import type { CoachPhrasingSlot } from './CoachPhrasingSlot';
import { coachPhrasings } from './coachPhrasings';
import { phrasingIndex } from './phrasingIndex';
import { sentenceCase } from './sentenceCase';

/**
 * One slot of the coach's grammar, said (MM-617): the phrasing `key` picks
 * (`phrasingIndex` over the slot and the key, which is a finding and its
 * day, `coachPhraseKey`), filled from `values`, and capitalized as a
 * sentence unless `piece` (a slot ending in `Words`, said inside another).
 * A `{name}` with no value is a programming error.
 */
export function coachPhrase(
  slot: CoachPhrasingSlot,
  key: string,
  values: Readonly<Record<string, string>> = {},
  { piece = false }: { piece?: boolean } = {},
): string {
  const variants: readonly string[] = coachPhrasings[slot];
  const template = variants[phrasingIndex(`${slot}|${key}`, variants.length)] ?? '';
  const filled = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new StateError(`The coach's phrasing ${slot} needs {${name}}.`);
    return value;
  });
  return piece ? filled : sentenceCase(filled);
}
