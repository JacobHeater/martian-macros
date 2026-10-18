import type { Meal } from '../domain/Meal';
import type { ItemInsightKind } from '../engine/ItemInsightKind';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { InlineInsightContent } from './InlineInsightContent';
import type { RecentInsight } from './RecentInsight';

/**
 * What a design story draws in place of what the app works out (MM-293):
 * grades (MM-370), which are not built, and inline insights (MM-362), the
 * Coach tab's list (MM-363) and Settings > Coach (MM-364) for kinds the app
 * does not have yet. The app hands in nothing, so each screen shows what
 * it works out itself. Items are named as the stories name them.
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
  /** Under an exercise of a workout, by the exercise's id, in place of what the app works out. */
  readonly exerciseNotes?: ReadonlyMap<string, InlineInsightContent>;
  /** Under the Dashboard's weigh-in, waist and water rows. */
  readonly rowNotes?: ReadonlyMap<'weight' | 'waist' | 'water', InlineInsightContent>;
  /** The Coach tab's recent insights, in place of what the app logged; the section shows whenever this is given. */
  readonly recent?: readonly RecentInsight[];
  /** The kinds Settings > Coach lists, in place of the app's own (`itemInsightKinds`). */
  readonly kinds?: readonly ItemInsightKind[];
}
