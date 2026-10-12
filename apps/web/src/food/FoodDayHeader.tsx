import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { DayStepper } from '../ui/DayStepper';
import { useShownDay } from './useShownDay';

/** The Food screen's header: the shown day, with steps to the days either side. */
export function FoodDayHeader() {
  const { state } = useApp();
  const today = useCell(state.today);
  const day = useShownDay();
  const go = (target: CalendarDate) => state.selectedDay.put(target === today ? undefined : target);
  return (
    <DayStepper
      label={Fmt.day(day, today)}
      onPrevious={() => go(day.addDays(-1))}
      onNext={day.isBefore(today) ? () => go(day.addDays(1)) : undefined}
      onLabelPress={day === today ? undefined : () => go(today)}
    />
  );
}
