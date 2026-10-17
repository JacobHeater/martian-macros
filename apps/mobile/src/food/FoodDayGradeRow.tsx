import { useInsightPreview } from '../coach/useInsightPreview';
import { MmListRow } from '../ui/MmListRow';
import { FoodGrade } from './FoodGrade';

/**
 * The day's grade (MM-370) as a quiet row after the completeness row, its
 * sibling for a fact about the whole day, built as that row is so their
 * icons and words line up: the words say what the letter is, and the
 * letter says more when pressed. Not in the app bar, which has no room for
 * it on a narrow phone. None in the app until grades are built.
 */
export function FoodDayGradeRow() {
  const dayGrade = useInsightPreview().dayGrade;
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
