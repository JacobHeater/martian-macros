import type { FoodGroup } from '../../../domain/food/FoodGroup';
import type { FoodTag } from '../language/FoodTag';
import { foodTagsOf } from '../language/foodTagsOf';
import type { CoachSwapMatch } from './CoachSwapMatch';
import type { CoachSwapRow } from './CoachSwapRow';
import { coachSwapTable } from './coachSwapTable';
import { swapWordsOf } from './swapWordsOf';

/** Each phrase of the table as `swapWordsOf` reads it, padded so it matches whole words only. */
const read = new Map<string, string>();
const phraseOf = (phrase: string): string => {
  let said = read.get(phrase);
  if (said === undefined) {
    said = ` ${swapWordsOf(phrase).join(' ')} `;
    read.set(phrase, said);
  }
  return said;
};

const hasAny = (name: string, phrases: readonly string[] | undefined) => (phrases ?? []).some((p) => name.includes(phraseOf(p)));

function matches(match: CoachSwapMatch, name: string, tags: ReadonlySet<FoodTag>): boolean {
  if (match.words === undefined && match.tags === undefined) return false;
  if (match.words !== undefined && !hasAny(name, match.words)) return false;
  if (match.andWords !== undefined && !hasAny(name, match.andWords)) return false;
  return (match.tags ?? []).every((tag) => tags.has(tag));
}

/**
 * The first row of the coach's swap table (MM-617) that matches a food or
 * a meal by its name: by its words, whole words in the singular, and its
 * tags (`foodTagsOf`), no `unless` phrase in it, and its group (MM-616)
 * one of the row's where both are known. Undefined when none does.
 */
export function coachSwapOf(name: string, group?: FoodGroup | undefined): CoachSwapRow | undefined {
  const said = ` ${swapWordsOf(name).join(' ')} `;
  const tags = foodTagsOf(name);
  return coachSwapTable.find(
    (row) =>
      row.match.some((m) => matches(m, said, tags)) &&
      !hasAny(said, row.unless) &&
      (group === undefined || row.groups === undefined || row.groups.includes(group)),
  );
}
