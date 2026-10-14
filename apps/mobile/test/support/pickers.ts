import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Fmt } from '../../src/format/Fmt';

/**
 * Drives the design system's own pickers (MM-263, MM-264) the way a person
 * does: the calendar's year list, month arrows and day cells, and the
 * drums' typed digits. Nothing native is anywhere in them.
 */
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Brings the calendar in `dialog` to `date` and presses it. */
export async function chooseDay(dialog: HTMLElement, date: CalendarDate): Promise<void> {
  const heading = () => within(dialog).getByRole('button', { name: /^[A-Z][a-z]+ \d{4}$/ });
  const shown = () => {
    const [month, year] = heading().textContent!.trim().split(' ');
    return { month: months.indexOf(month!) + 1, year: Number(year) };
  };
  if (shown().year !== date.year) {
    await userEvent.click(heading());
    await userEvent.click(within(dialog).getByRole('option', { name: String(date.year) }));
  }
  for (let turns = 0; shown().month !== date.month && turns < 12; turns += 1) {
    const forward = shown().month < date.month;
    await userEvent.click(within(dialog).getByRole('button', { name: forward ? 'Next month' : 'Previous month' }));
  }
  await userEvent.click(within(dialog).getByRole('gridcell', { name: Fmt.longDate(date) }));
}

/** Gives a day to the dialog that asks for one ("2026-10-02") and confirms it. */
export async function pickDate(iso: string): Promise<void> {
  const dialog = await screen.findByRole('dialog');
  await chooseDay(dialog, CalendarDate.parse(iso));
  await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
}

/** Types `value` into the drum called `name`, digit by digit, as the keyboard does. */
export function turnDrum(dialog: HTMLElement, name: string, value: number, digits = 1): void {
  const drum = within(dialog).getByRole('spinbutton', { name });
  for (const digit of String(value).padStart(digits, '0')) fireEvent.keyDown(drum, { key: digit });
}

interface ClockTurn {
  /** On the twelve-hour clock. */
  hour: number;
  minute: number;
  second?: number | undefined;
  /** Pressed when given; otherwise the dialog keeps the half of the day it opened on. */
  period?: 'AM' | 'PM' | undefined;
}

/** Sets the drums of a time dialog, and AM or PM when asked. */
export async function turnClock(dialog: HTMLElement, { hour, minute, second, period }: ClockTurn): Promise<void> {
  turnDrum(dialog, 'Hour', hour);
  turnDrum(dialog, 'Minute', minute, 2);
  if (second !== undefined) turnDrum(dialog, 'Second', second, 2);
  if (period !== undefined) await userEvent.click(within(dialog).getByRole('button', { name: period }));
}

/** A time on the 24-hour clock ("23:20") as the drums take it. */
export function clockTurnOf(value: string): ClockTurn {
  const [hour24, minute] = value.split(':').map(Number) as [number, number];
  return { hour: hour24 % 12 === 0 ? 12 : hour24 % 12, minute, period: hour24 < 12 ? 'AM' : 'PM' };
}

/** Gives a time of day to the dialog that asks for one ("08:30"). With `confirm` false the dialog is left open. */
export async function pickTime(value: string, { confirm = true }: { confirm?: boolean } = {}): Promise<HTMLElement> {
  const dialog = await screen.findByRole('dialog');
  await turnClock(dialog, clockTurnOf(value));
  if (confirm) await userEvent.click(within(dialog).getByRole('button', { name: 'OK' }));
  return dialog;
}
