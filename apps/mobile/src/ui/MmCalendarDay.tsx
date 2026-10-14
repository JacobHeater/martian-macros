import type { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import './ui.css';

interface MmCalendarDayProps {
  date: CalendarDate;
  chosen: boolean;
  today: boolean;
  /** Outside the allowed range: drawn quiet, and pressing it refuses rather than chooses. */
  outside: boolean;
  /** The one day of the grid the keyboard lands on. */
  focusable: boolean;
  onSelect: () => void;
}

/** One day of the calendar grid (MM-263): a cell that says its full date, and whether it is chosen or today. */
export function MmCalendarDay({ date, chosen, today, outside, focusable, onSelect }: MmCalendarDayProps) {
  return (
    <button
      type="button"
      role="gridcell"
      className={`mm-day${chosen ? ' mm-day-chosen' : ''}${today ? ' mm-day-today' : ''}${outside ? ' mm-day-outside' : ''}`}
      aria-selected={chosen}
      aria-disabled={outside ? true : undefined}
      aria-current={today ? 'date' : undefined}
      aria-label={Fmt.longDate(date)}
      tabIndex={focusable ? 0 : -1}
      data-day={date.toString()}
      onClick={onSelect}
    >
      {date.day}
    </button>
  );
}
