import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useInsightPreview } from '../coach/useInsightPreview';
import type { FoodEntry } from '../domain/FoodEntry';
import { gradeOfFoodEntry } from '../engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../engine/gradeOfMeal';
import { MmListRow } from '../ui/MmListRow';
import { FoodGrade } from './FoodGrade';

/**
 * The day's grade (MM-370) as a quiet row after the completeness row, its
 * sibling for a fact about the whole day, built as that row is so their
 * icons and words line up: the words say what the letter is, and the
 * letter says more when pressed. Not in the app bar, which has no room for
 * it on a narrow phone. Nothing for a day with no food.
 */
export function FoodDayGradeRow({ entries }: { entries: readonly FoodEntry[] }) {
  const { state } = useApp();
  const hand = useCell(state.handSize);
  const dayGrade =
    useInsightPreview().dayGrade ?? gradeOfMeal(entries.map((entry) => ({ kcal: entry.kcal, grade: gradeOfFoodEntry(entry, { hand }) })), 'day');
  if (dayGrade === undefined) return null;
  return (
    <MmListRow
      leadingIcon="report"
      title="Grade for the day"
      subtitle="Counted by calories"
      trailing={<FoodGrade grade={dayGrade} subject="This day" scope="day" />}
    />
  );
}
