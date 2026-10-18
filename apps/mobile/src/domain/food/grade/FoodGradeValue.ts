import type { FoodGradeLetter } from './FoodGradeLetter';

/**
 * A food's, a meal's or a day's grade (MM-370), or why there can't be one:
 * a missing value is never counted as zero (MM-310), so a food without
 * what the method needs is not guessed. A graded food carries the score its
 * letter came from (MM-369), so meals and days can be averaged by it.
 */
export type FoodGradeValue =
  | { readonly kind: 'graded'; readonly letter: FoodGradeLetter; readonly score: number }
  | { readonly kind: 'ungradable'; readonly reason: string };
