import type { CalendarDate } from '../domain/CalendarDate';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';

/** The day the Food screen is showing: the one chosen, or today. */
export function useShownDay(): CalendarDate {
  const { state } = useApp();
  const selected = useCell(state.selectedDay);
  const today = useCell(state.today);
  return selected ?? today;
}
