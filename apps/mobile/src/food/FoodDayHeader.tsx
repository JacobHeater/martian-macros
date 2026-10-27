import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayStepper } from '../ui/DayStepper';
import { MmIcon } from '../ui/MmIcon';
import { MmStatusChip } from '../ui/MmStatusChip';
import { completenessIcon } from './completenessIcon';
import { completenessLabel } from './completenessLabel';
import { dayKindLabel } from './dayKindLabel';
import { useShownDay } from './useShownDay';
import './food.css';

/**
 * The Food screen's header: the shown day, with steps to the days either
 * side, and the day's completeness mark after it once it is marked
 * (MM-255). The marks show state; the controls are the rows after the
 * meals: completeness (`FoodCompletenessRow`) and, since the owner called
 * the header's flag out (MM-655), the day's Refeed or Day off
 * (`FoodDayMarkRow`, MM-611), shown here as a neutral chip, the same for
 * both.
 */
export function FoodDayHeader() {
  const { state } = useApp();
  const today = useCell(state.today);
  const day = useShownDay();
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  const kind = useLoaded(state.dayKind(day)) ?? 'none';
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
      {kind === 'none' ? null : <MmStatusChip label={dayKindLabel(kind)} />}
    </span>
  );
}
