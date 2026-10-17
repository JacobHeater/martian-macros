import type { Meal } from '../domain/Meal';
import type { FoodGradeValue } from '../food/FoodGradeValue';
import type { InlineInsightContent } from './InlineInsightContent';
import type { RecentInsight } from './RecentInsight';

/**
 * What the screens draw of inline insights (MM-362), grades (MM-370), the
 * Coach tab's list (MM-363) and Settings > Coach (MM-364) until those are
 * built. The design gate draws them first (MM-293), so for now only a
 * design story hands any of this in; the app hands in nothing and shows
 * none of it. Items are named as the stories name them.
 */
export interface InsightPreview {
  /** Under a logged food, by the entry's name. */
  readonly entryNotes?: ReadonlyMap<string, InlineInsightContent>;
  /** A logged food's grade, by the entry's name. */
  readonly entryGrades?: ReadonlyMap<string, FoodGradeValue>;
  readonly mealGrades?: ReadonlyMap<Meal, FoodGradeValue>;
  readonly dayGrade?: FoodGradeValue;
  /** A food's grade in search and on the amount step, from the food's name. */
  readonly gradeOfFood?: (name: string) => FoodGradeValue | undefined;
  /** Under an exercise of a workout, by the exercise's id. */
  readonly exerciseNotes?: ReadonlyMap<string, InlineInsightContent>;
  /** Under the Dashboard's weigh-in, waist and water rows. */
  readonly rowNotes?: ReadonlyMap<'weight' | 'waist' | 'water', InlineInsightContent>;
  /** The Coach tab's recent insights; the section shows whenever this is given, empty or not. */
  readonly recent?: readonly RecentInsight[];
  /** Settings shows its Coach section. */
  readonly coachSettings?: boolean;
}
