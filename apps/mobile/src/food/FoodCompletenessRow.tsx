import type { CalendarDate } from '../domain/CalendarDate';
import type { DayCompleteness } from '../domain/DayCompleteness';
import { easyToMissVisible } from '../domain/food/easyToMiss/easyToMissVisible';
import type { FoodEntry } from '../domain/FoodEntry';
import { useApp } from '../app/useApp';
import { useNavigator } from '../app/useNavigator';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { askLowDayComplete } from './askLowDayComplete';
import { completenessIcon } from './completenessIcon';
import { completenessLabel } from './completenessLabel';
import { addFoodFrom } from './addFoodFrom';
import { showEasyToMissSheet } from './showEasyToMissSheet';

interface FoodCompletenessRowProps {
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

/**
 * The day's completeness, as one quiet row after the last meal (MM-255):
 * its mark, its state in words, and the question it opens. A rare action,
 * so it is a row and not a control of its own. Marking it complete first
 * asks about the easy-to-miss foods, when that check is due (MM-575): only
 * "nothing missed" marks it, and a missed one opens add-food instead. A day
 * under half the floor is then asked about once (MM-114).
 */
export function FoodCompletenessRow({ day, entries }: FoodCompletenessRowProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const navigator = useNavigator();
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  const floor = useCell(state.coach)?.calorieFloorKcal;
  const setup = useLoaded(state.setup);
  const easyToMiss = useLoaded(state.easyToMiss);
  const today = useCell(state.today);
  const underEating = useCell(state.underEatingFinding);
  // When the check is due (MM-152's schedule), and never for someone with an eating-disorder history or while the
  // under-eating notice is up (MM-114): a prompt to find more to record is the wrong emphasis.
  const checkDue =
    setup !== undefined &&
    easyToMiss !== undefined &&
    easyToMissVisible({
      today,
      onboardedOn: setup.onboardedOn,
      preference: easyToMiss,
      suppressed: setup.screening.eatingDisorderHistory || underEating !== undefined,
    });

  const ask = async () => {
    const chosen = await overlays.options<DayCompleteness>({
      title: 'Is this day fully logged?',
      options: [
        { value: 'complete', label: 'Complete' },
        { value: 'partial', label: 'Partial' },
        { value: 'unmarked', label: 'Not marked' },
      ],
      selected: completeness,
    });
    if (chosen === undefined) return;
    let next = chosen.value;
    if (next === 'complete' && completeness !== 'complete' && checkDue) {
      void services.preferences.markEasyToMissShown(today);
      const answer = await showEasyToMissSheet(overlays);
      if (answer === undefined) return;
      if (answer.kind === 'add') {
        void addFoodFrom({ overlays, navigator }, day, {
          ...(answer.query === undefined ? {} : { initialQuery: answer.query }),
          ...(answer.estimateSize === undefined ? {} : { estimateSize: answer.estimateSize }),
        });
        return;
      }
    }
    const logged = entries.reduce((total, e) => total + e.kcal, 0);
    if (next === 'complete' && floor !== undefined && logged < floor / 2) {
      const answer = await askLowDayComplete(overlays, logged);
      if (answer === undefined) return;
      next = answer;
    }
    await services.dayMarks.setCompleteness(day, next);
  };

  return (
    <MmListRow
      leadingIcon={completenessIcon(completeness)}
      title={completeness === 'unmarked' ? 'Is this day fully logged?' : completenessLabel(completeness)}
      subtitle={
        // Each state says what the estimate does with the day; an unmarked one counts unless it is far below the
        // usual (MM-27, MM-392), worded for the log and not the eating, as the coaching and safety roles asked.
        completeness === 'unmarked'
          ? 'Counted unless it looks unfinished.'
          : completeness === 'complete'
            ? 'Counted as a whole day.'
            : 'Left out of your metabolism estimate.'
      }
      opens
      onPress={() => void ask()}
    />
  );
}
