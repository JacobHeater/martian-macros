import { useMemo } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import type { DayKind } from '../domain/DayKind';
import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayKindController } from '../state/DayKindController';
import { DayStepper } from '../ui/DayStepper';
import { MmIcon } from '../ui/MmIcon';
import { MmIconButton } from '../ui/MmIconButton';
import { MmStatusChip } from '../ui/MmStatusChip';
import { useOverlays } from '../ui/useOverlays';
import { completenessIcon } from './completenessIcon';
import { completenessLabel } from './completenessLabel';
import { dayKindLabel } from './dayKindLabel';
import { useShownDay } from './useShownDay';
import './food.css';

/** The marks offered, in the owner's order, then the way to clear one. */
const offered: readonly DayKind[] = ['refeed', 'dayOff', 'none'];

/**
 * The Food screen's header: the shown day, with steps to the days either
 * side, and the day's completeness mark after it once it is marked
 * (MM-255). The mark shows state; the control is the row after the meals.
 *
 * A day up to today can be marked a Refeed or a Day off (MM-611) from its
 * "Mark day" action; the mark shows as a neutral chip, the same for both. It
 * is separate from completeness and changes no calculation. A day still to
 * come has no action, since a plan is not a record.
 */
export function FoodDayHeader() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const day = useShownDay();
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  const kind = useLoaded(state.dayKind(day)) ?? 'none';
  const marks = useMemo(() => new DayKindController({ dayKinds: services.dayKinds, clock: services.clock }), [services]);
  const go = (target: CalendarDate) => state.selectedDay.put(target === today ? undefined : target);

  const ask = async () => {
    const chosen = await overlays.options<DayKind>({
      title: 'Mark this day',
      options: offered.map((value) => ({ value, label: dayKindLabel(value) })),
      selected: kind,
    });
    if (chosen === undefined || chosen.value === kind) return;
    await marks.mark(day, chosen.value);
  };

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
      {day.isAfter(today) ? null : (
        <MmIconButton icon="flag" label="Mark day" opens="dialog" onPress={() => void ask()} />
      )}
    </span>
  );
}
