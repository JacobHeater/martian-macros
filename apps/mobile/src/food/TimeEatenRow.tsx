import type { Meal } from '../domain/Meal';
import { mealUsualMinute } from '../domain/mealUsualMinute';
import { clockTimeText } from '../format/clockTimeText';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';

interface TimeEatenRowProps {
  /** Minutes after midnight of the entry's day, or undefined when not set. */
  eatenAt: number | undefined;
  /** Where the clock opens when no time is set: the meal's usual time. */
  meal: Meal;
  onChange: (eatenAt: number) => void;
}

const said = (minuteOfDay: number) => clockTimeText(new Date(2000, 0, 1, Math.trunc(minuteOfDay / 60), minuteOfDay % 60));

/**
 * When the food was eaten (MM-570), laid out as Settings' reminder time is
 * (rule 9): one row with the time, or "Not set", that opens the design
 * system's clock to the minute. A time can be changed, never cleared.
 */
export function TimeEatenRow({ eatenAt, meal, onChange }: TimeEatenRowProps) {
  const overlays = useOverlays();
  const change = async () => {
    const picked = await overlays.timeOfDay({
      initialMinuteOfDay: eatenAt ?? mealUsualMinute(meal),
      helpText: 'Time eaten',
      everyMinute: true,
    });
    if (picked !== undefined) onChange(picked);
  };
  return (
    <MmListRow
      dense
      leadingIcon="timer"
      title="Time eaten"
      subtitle={eatenAt === undefined ? 'Not set' : said(eatenAt)}
      opens
      onPress={() => void change()}
    />
  );
}
