import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from 'react';
import { CalendarDate } from '../domain/CalendarDate';
import { MmCalendarDay } from './MmCalendarDay';
import { MmIcon } from './MmIcon';
import { MmIconButton } from './MmIconButton';
import { MmOption } from './MmOption';
import { MmPressable } from './MmPressable';
import './ui.css';

interface MmDatePickerProps {
  /** What a person hears for the grid. */
  name: string;
  value: CalendarDate;
  first: CalendarDate;
  last: CalendarDate;
  /** Marked in the grid when given. */
  today?: CalendarDate | undefined;
  onChange: (day: CalendarDate) => void;
  /** A day outside the range was pressed; whatever shows the picker says the range. */
  onRefuse?: ((day: CalendarDate) => void) | undefined;
}

interface Month {
  readonly year: number;
  readonly month: number;
}

const weekdays: readonly (readonly [short: string, long: string])[] = [
  ['Su', 'Sunday'],
  ['Mo', 'Monday'],
  ['Tu', 'Tuesday'],
  ['We', 'Wednesday'],
  ['Th', 'Thursday'],
  ['Fr', 'Friday'],
  ['Sa', 'Saturday'],
];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** How far a finger travels across the grid before it is a swipe to another month. */
const swipePx = 48;

/** Sunday is 0; 1970-01-01 was a Thursday. */
const weekdayOf = (day: CalendarDate) => (((day.epochDay % 7) + 7 + 4) % 7);
const monthOf = (day: CalendarDate): Month => ({ year: day.year, month: day.month });
const firstOf = ({ year, month }: Month) => CalendarDate.of(year, month, 1);
const monthsAfter = ({ year, month }: Month, count: number): Month => {
  const index = year * 12 + (month - 1) + count;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 + 1 };
};
const daysIn = (month: Month) => firstOf(month).daysUntil(firstOf(monthsAfter(month, 1)));
const sameMonth = (a: Month, b: Month) => a.year === b.year && a.month === b.month;
const monthBefore = (a: Month, b: Month) => a.year < b.year || (a.year === b.year && a.month < b.month);
const clampMonth = (month: Month, first: Month, last: Month) =>
  monthBefore(month, first) ? first : monthBefore(last, month) ? last : month;

/**
 * A calendar drawn by the design system (MM-263): a month grid with the
 * weekday row, today marked, the chosen day in Ember, days outside the
 * range quiet and inert; previous and next month as icon buttons; the month
 * and year as a heading that opens a year list for a quick jump. The arrows
 * move between days, Enter chooses, and a swipe changes the month.
 */
export function MmDatePicker({ name, value, first, last, today, onChange, onRefuse }: MmDatePickerProps) {
  const firstMonth = monthOf(first);
  const lastMonth = monthOf(last);
  const [shown, setShown] = useState<Month>(() => clampMonth(monthOf(value), firstMonth, lastMonth));
  const [focused, setFocused] = useState(value);
  const [yearsOpen, setYearsOpen] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const years = useRef<HTMLDivElement>(null);
  const moveFocus = useRef(false);
  const swipeFrom = useRef<{ x: number; y: number } | undefined>(undefined);

  const canGoBack = monthBefore(firstMonth, shown);
  const canGoForward = monthBefore(shown, lastMonth);
  const inRange = (day: CalendarDate) => !day.isBefore(first) && !day.isAfter(last);

  const show = (month: Month) => setShown(clampMonth(month, firstMonth, lastMonth));

  const select = (day: CalendarDate) => {
    setFocused(day);
    if (inRange(day)) onChange(day);
    else onRefuse?.(day);
  };

  const focusDay = (day: CalendarDate) => {
    setFocused(day);
    show(monthOf(day));
    moveFocus.current = true;
  };

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    grid.current?.querySelector<HTMLElement>(`[data-day="${focused.toString()}"]`)?.focus();
  }, [focused, shown]);

  useEffect(() => {
    if (!yearsOpen) return;
    const chosen = years.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (typeof chosen?.scrollIntoView === 'function') chosen.scrollIntoView({ block: 'center' });
  }, [yearsOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const byDays: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const days = byDays[event.key];
    let target: CalendarDate | undefined;
    if (days !== undefined) target = focused.addDays(days);
    else if (event.key === 'Home') target = focused.addDays(-weekdayOf(focused));
    else if (event.key === 'End') target = focused.addDays(6 - weekdayOf(focused));
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const month = monthsAfter(monthOf(focused), event.key === 'PageUp' ? -1 : 1);
      target = CalendarDate.of(month.year, month.month, Math.min(focused.day, daysIn(month)));
    }
    if (target === undefined) return;
    event.preventDefault();
    focusDay(target);
  };

  const endSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const from = swipeFrom.current;
    swipeFrom.current = undefined;
    if (from === undefined) return;
    const dx = event.clientX - from.x;
    if (Math.abs(dx) < swipePx || Math.abs(dx) < Math.abs(event.clientY - from.y)) return;
    if (dx < 0 && canGoForward) show(monthsAfter(shown, 1));
    if (dx > 0 && canGoBack) show(monthsAfter(shown, -1));
  };

  const title = `${monthNames[shown.month - 1]} ${shown.year}`;
  const leading = weekdayOf(firstOf(shown));
  const count = daysIn(shown);
  const cells: (CalendarDate | undefined)[] = [
    ...Array.from({ length: leading }, () => undefined),
    ...Array.from({ length: count }, (_, at) => CalendarDate.of(shown.year, shown.month, at + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(undefined);
  const weeks = Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
  // The keyboard lands on the focused day when it is shown, else the chosen day, else the first day shown.
  const landing = sameMonth(monthOf(focused), shown) ? focused : sameMonth(monthOf(value), shown) ? value : firstOf(shown);

  return (
    <div className="mm-calendar">
      <div className="mm-calendar-head">
        <MmIconButton icon="chevronLeft" label="Previous month" onPress={canGoBack ? () => show(monthsAfter(shown, -1)) : undefined} />
        <div className="mm-calendar-month">
          <MmPressable expanded={yearsOpen} onPress={() => setYearsOpen(!yearsOpen)}>
            <span className="mm-calendar-month-label">
              {title}
              <MmIcon name="chevronDown" size={20} />
            </span>
          </MmPressable>
        </div>
        <MmIconButton icon="chevronRight" label="Next month" onPress={canGoForward ? () => show(monthsAfter(shown, 1)) : undefined} />
      </div>
      {yearsOpen ? (
        <div ref={years} className="mm-year-list" role="listbox" aria-label="Year">
          {Array.from({ length: last.year - first.year + 1 }, (_, at) => first.year + at).map((year) => (
            <MmOption
              key={year}
              label={String(year)}
              chosen={year === shown.year}
              onSelect={() => {
                show({ year, month: shown.month });
                setYearsOpen(false);
              }}
            />
          ))}
        </div>
      ) : (
        <div
          key={title}
          ref={grid}
          className="mm-calendar-grid"
          role="grid"
          aria-label={name}
          onKeyDown={onKeyDown}
          onPointerDown={(event) => {
            swipeFrom.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={endSwipe}
          onPointerCancel={() => {
            swipeFrom.current = undefined;
          }}
        >
          <div className="mm-calendar-week" role="row">
            {weekdays.map(([short, long]) => (
              <span key={short} className="mm-calendar-weekday" role="columnheader" aria-label={long}>
                {short}
              </span>
            ))}
          </div>
          {weeks.map((week, at) => (
            <div key={at} className="mm-calendar-week" role="row">
              {week.map((day, slot) =>
                day === undefined ? (
                  <span key={slot} role="gridcell" aria-hidden="true" />
                ) : (
                  <MmCalendarDay
                    key={day.epochDay}
                    date={day}
                    chosen={day === value}
                    today={day === today}
                    outside={!inRange(day)}
                    focusable={day === landing}
                    onSelect={() => select(day)}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
