import type { FoodGradeLetter } from './FoodGradeLetter';
import type { GradeOmission } from './GradeOmission';

/**
 * A food's, a meal's or a day's grade (MM-370), or why there can't be one:
 * a missing value is never counted as zero (MM-310), so a food without
 * what the method needs is not guessed. A graded food carries the score its
 * letter came from (MM-380), so meals and days can be averaged by it; what
 * its source left unstated and so was not counted; and how many of the ten
 * vitamins and minerals it states, so the popover can say what the
 * component was counted from (MM-382). A meal's or a day's grade states
 * none of its own.
 */
export type FoodGradeValue =
  | {
      readonly kind: 'graded';
      readonly letter: FoodGradeLetter;
      readonly score: number;
      readonly notCounted: readonly GradeOmission[];
      readonly statedMicronutrients: number;
    }
  | { readonly kind: 'ungradable'; readonly reason: string };
