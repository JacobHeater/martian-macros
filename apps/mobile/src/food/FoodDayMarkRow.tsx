import { useMemo } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import type { DayKind } from '../domain/DayKind';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { DayKindController } from '../state/DayKindController';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { dayKindLabel } from './dayKindLabel';

interface FoodDayMarkRowProps {
  day: CalendarDate;
}

/** The marks offered, in the owner's order, then the way to clear one (MM-611). */
const offered: readonly DayKind[] = ['refeed', 'dayOff', 'none'];

/**
 * The day's mark, a Refeed or a Day off (MM-611), as one quiet row after the
 * meals beside the day's completeness (MM-255): its state in words and the
 * question it opens. It stood in the day's header as a flag until the owner
 * called it out (MM-655): a rare action, so it is a row and not a control of
 * its own. A day still to come has no row, since a plan is not a record.
 */
export function FoodDayMarkRow({ day }: FoodDayMarkRowProps) {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const today = useCell(state.today);
  const kind = useLoaded(state.dayKind(day)) ?? 'none';
  const marks = useMemo(() => new DayKindController({ dayKinds: services.dayKinds, clock: services.clock }), [services]);
  if (day.isAfter(today)) return null;

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
    <MmListRow
      leadingIcon="flag"
      title={kind === 'none' ? 'Mark a refeed or a day off' : dayKindLabel(kind)}
      // A mark changes no calculation; it only keeps the coach from picking the day apart (MM-611, MM-612).
      subtitle={kind === 'none' ? 'Not marked.' : 'Marked, so the coach does not judge this day on its own.'}
      opens
      onPress={() => void ask()}
    />
  );
}
