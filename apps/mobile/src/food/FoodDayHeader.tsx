import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayStepper } from '../ui/DayStepper';
import { MmStatusChip } from '../ui/MmStatusChip';
import { dayKindLabel } from './dayKindLabel';
import { useShownDay } from './useShownDay';
import './food.css';

/**
 * The Food screen's header: the shown day, with steps to the days either
 * side, and the day's Refeed or Day off after it as a neutral chip, the
 * same for both (MM-611). The chip shows state; the controls are the rows
 * after the meals (MM-655, `FoodDayMarkRow`). The day's completeness left
 * the header for the hero's top right (MM-692, `FoodCompletenessChip`).
 */
export function FoodDayHeader() {
  const { state } = useApp();
  const today = useCell(state.today);
  const day = useShownDay();
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
      {kind === 'none' ? null : <MmStatusChip label={dayKindLabel(kind)} />}
    </span>
  );
}
