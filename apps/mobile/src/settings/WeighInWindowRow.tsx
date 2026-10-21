import { clockTimeText } from '../format/clockTimeText';
import { WeighInWindow } from '../healthIngest/WeighInWindow';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';

const minutesInDay = 24 * 60;

/** A minute of the day as a clock says it, and the end of the day as midnight. */
const said = (minuteOfDay: number) =>
  minuteOfDay === minutesInDay
    ? 'midnight'
    : clockTimeText(new Date(2000, 0, 1, Math.trunc(minuteOfDay / 60), minuteOfDay % 60));

/**
 * The hours in which an imported reading counts as the morning weigh-in
 * (MM-441), beside the primary scale and laid out as it is (rule 9): one row
 * with the window in force, whose button asks when it starts, then when it
 * ends, to the minute. The window never crosses midnight: it ends after it
 * starts, or at midnight, which is 12:00 AM on the drums. Moved back to 4:00
 * AM to 12:00 PM, it is the usual window again.
 */
export function WeighInWindowRow() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const inForce = useLoaded(state.weighInWindow);
  if (inForce === undefined) return null;

  const usual = inForce.equals(WeighInWindow.usual);
  const subtitle =
    `${said(inForce.startMinute)} to ${said(inForce.endMinute)}` +
    `${usual ? ', the usual morning' : ''}. The first reading in it counts as the day’s weigh-in.`;

  const change = async () => {
    const start = await overlays.timeOfDay({
      initialMinuteOfDay: inForce.startMinute,
      helpText: 'Weigh-in window starts',
      everyMinute: true,
    });
    if (start === undefined) return;
    const end = await overlays.timeOfDay({
      // Midnight is 12:00 AM on the drums, so a window that still ends after the new start opens on its end.
      initialMinuteOfDay: inForce.endMinute > start ? inForce.endMinute % minutesInDay : 0,
      helpText: 'Weigh-in window ends',
      everyMinute: true,
      refuse: (minute) =>
        minute === 0 || minute > start ? undefined : `Choose a time after ${said(start)}, or 12:00 AM for midnight.`,
    });
    if (end === undefined) return;
    const moved = new WeighInWindow({ startMinute: start, endMinute: end === 0 ? minutesInDay : end });
    await save(moved.equals(WeighInWindow.usual) ? undefined : moved);
  };

  // A failed change is said as Settings says one, in a snack outside the rows (MM-347).
  const save = async (moved: WeighInWindow | undefined): Promise<void> => {
    try {
      await services.weighInWindow.saveWeighInWindow(moved);
    } catch {
      overlays.snack('Your weigh-in window could not be saved. Nothing was changed.', {
        label: 'Try again',
        onAction: () => void save(moved),
      });
    }
  };

  return (
    <MmListRow
      leadingIcon="timer"
      title="Weigh-in window"
      subtitle={subtitle}
      trailingAction={<MmIconButton icon="edit" label="Change weigh-in window" opens="dialog" onPress={() => void change()} />}
    />
  );
}
