import type { FoodDraft } from '../domain/food/custom/FoodDraft';
import { foodDraftProblems } from '../domain/food/custom/foodDraftProblems';
import { foodDraftJson } from './foodDraftJson';

/**
 * The message for the person's assistant when an answer has problems
 * (MM-709): each problem under the food it belongs to, then the foods as
 * they stand now, the person's changes included, and the request for every
 * food back, corrected, in the same format.
 */
export function foodFixMessage(foods: readonly FoodDraft[]): string {
  const lines: string[] = [];
  foods.forEach((food, at) => {
    const problems = foodDraftProblems(food);
    if (problems.length > 0) lines.push(`- Food ${at + 1}, "${food.name}": ${problems.join(' ')}`);
  });
  return [
    'Martian Macros could not save these foods yet. Please fix these problems:',
    '',
    ...lines,
    '',
    'Here are the foods as they stand now, including changes I made. Keep my changes, fix the problems, and answer with every food again in the same format, as one JSON code block:',
    '',
    '```json',
    foodDraftJson(foods),
    '```',
  ].join('\n');
}
