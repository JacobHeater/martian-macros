import type { MealDraft } from '../domain/food/meal/MealDraft';
import { mealItemProblems } from '../domain/food/meal/mealItemProblems';
import { mealDraftJson } from './mealDraftJson';

/**
 * The message for the person's assistant when an answer has problems
 * (MM-586): each problem under the item it belongs to, then the meal as it
 * stands now, the person's changes included, and the request for the whole
 * meal back, corrected, in the same format.
 */
export function mealFixMessage(draft: MealDraft): string {
  const lines: string[] = [];
  if (draft.name.trim() === '') lines.push('- The meal has no name. Ask me what to call it.');
  draft.items.forEach((item, at) => {
    const problems = mealItemProblems(item);
    if (problems.length > 0) lines.push(`- Item ${at + 1}, "${item.name}": ${problems.join(' ')}`);
  });
  return [
    'Martian Macros could not log this meal yet. Please fix these problems:',
    '',
    ...lines,
    '',
    'Here is the meal as it stands now, including changes I made. Keep my changes, fix the problems, and answer with the whole meal again in the same format, as one JSON code block:',
    '',
    '```json',
    mealDraftJson(draft),
    '```',
  ].join('\n');
}
