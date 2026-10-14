import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayStepper } from '../ui/DayStepper';
import { MmIcon } from '../ui/MmIcon';
import { completenessIcon } from './completenessIcon';
import { completenessLabel } from './completenessLabel';
import { useShownDay } from './useShownDay';
import './food.css';

/**
 * The Food screen's header: the shown day, with steps to the days either
 * side, and the day's completeness mark after it once it is marked
 * (MM-255). The mark shows state; the control is the row after the meals.
 */
export function FoodDayHeader() {
  const { state } = useApp();
  const today = useCell(state.today);
  const day = useShownDay();
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  const go = (target: CalendarDate) => state.selectedDay.put(target === today ? undefined : target);
  return (
    <span className="food-day-header">
      <DayStepper
        label={Fmt.day(day, today)}
        onPrevious={() => go(day.addDays(-1))}
        onNext={day.isBefore(today) ? () => go(day.addDays(1)) : undefined}
        onLabelPress={day === today ? undefined : () => go(today)}
      />
      {completeness === 'unmarked' ? null : (
        <span className="food-day-mark" role="img" aria-label={completenessLabel(completeness)}>
          <MmIcon name={completenessIcon(completeness)} size={20} />
        </span>
      )}
    </span>
  );
}
