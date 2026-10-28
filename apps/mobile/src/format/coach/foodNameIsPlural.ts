import { readableFoodName } from './readableFoodName';

/**
 * Whether a food's name reads as a plural ("fries", "loaded nachos",
 * "large eggs"), so the coach says "are the drag" and gives it no article
 * (MM-684): its last word ends in an s that is not "ss", "us" or "is".
 */
export function foodNameIsPlural(name: string): boolean {
  const last = readableFoodName(name).split(' ').pop()?.toLowerCase() ?? '';
  return last.length > 2 && last.endsWith('s') && !/(ss|us|is)$/.test(last);
}
