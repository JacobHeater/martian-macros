import type { CalendarDate } from '../domain/CalendarDate';
import type { DayCompleteness } from '../domain/DayCompleteness';
import type { FoodEntry } from '../domain/FoodEntry';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { askLowDayComplete } from './askLowDayComplete';
import { completenessIcon } from './completenessIcon';
import { completenessLabel } from './completenessLabel';

interface FoodCompletenessRowProps {
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

/**
 * The day's completeness, as one quiet row after the last meal (MM-255):
 * its mark, its state in words, and the question it opens. A rare action,
 * so it is a row and not a control of its own. A day under half the floor
 * is asked about once, as it is marked complete (MM-114).
 */
export function FoodCompletenessRow({ day, entries }: FoodCompletenessRowProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  const floor = useCell(state.coach)?.calorieFloorKcal;

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
        completeness === 'unmarked'
          ? 'Mark it complete or partial.'
          : completeness === 'complete'
            ? 'Counted as a whole day.'
            : 'Left out of your metabolism estimate.'
      }
      opens
      onPress={() => void ask()}
    />
  );
}
