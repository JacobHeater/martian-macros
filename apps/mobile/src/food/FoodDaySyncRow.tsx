import type { CalendarDate } from '../domain/CalendarDate';
import type { FoodEntry } from '../domain/FoodEntry';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmListRow } from '../ui/MmListRow';
import { useCopyToAnotherPhone } from './phone/useCopyToAnotherPhone';

interface FoodDaySyncRowProps {
  day: CalendarDate;
  entries: readonly FoodEntry[];
}

/**
 * "Sync this day to another phone" (MM-719), a row with the day's other rows after the meals (MM-255, MM-611), above
 * the day's mark: the whole day shown, its foods with their times, its water and its marks, sent to the other phone
 * by the move's code (MM-715), where its day is made to match once confirmed. Only a day with something logged
 * has the row, and no day still to come.
 */
export function FoodDaySyncRow({ day, entries }: FoodDaySyncRowProps) {
  const { state } = useApp();
  const copyToPhone = useCopyToAnotherPhone();
  const today = useCell(state.today);
  const water = useLoaded(state.waterForDay(day)) ?? [];
  const kind = useLoaded(state.dayKind(day)) ?? 'none';
  const completeness = useLoaded(state.completeness(day)) ?? 'unmarked';
  if (day.isAfter(today) || (entries.length === 0 && water.length === 0)) return null;

  return (
    <MmListRow
      leadingIcon="movePhone"
      title="Sync this day to another phone"
      subtitle="Its foods, water and marks; your other phone’s day becomes this one."
      opens
      onPress={() => void copyToPhone(day, { entries, water, whole: { kind, completeness } })}
    />
  );
}
