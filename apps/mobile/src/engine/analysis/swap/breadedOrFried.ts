import { foodTagsOf } from '../language/foodTagsOf';
import { coachSwapOf } from './coachSwapOf';

/** The swap table's rows for a food breaded or fried (MM-617). */
const rows: readonly string[] = ['generalTso', 'eggRoll', 'friedChickenSandwich', 'friedSteak', 'friedChicken', 'friedSeafood', 'fried'];

/**
 * Whether a food's name says it is breaded or fried (MM-617): its tags
 * (`foodTagsOf`), or a row of the coach's swap table for fried and breaded
 * foods (General Tso's chicken, fried chicken, "crispy").
 */
export function breadedOrFried(name: string): boolean {
  const tags = foodTagsOf(name);
  if (tags.has('fried') || tags.has('breaded')) return true;
  const row = coachSwapOf(name);
  return row !== undefined && rows.includes(row.key);
}
