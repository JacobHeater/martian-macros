import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, vi } from 'vitest';
import type { FixedClock } from '../../src/fixtures/FixedClock';
import { clockTurnOf, pickDate, turnClock } from './pickers';

/**
 * For a file of tests about running timers: the app's ticking is the
 * test's to move.
 */
export function withTimersInHand(): void {
  beforeEach(() => {
    // Only what repeats: the app's running displays and its rest alarm tick
    // on an interval. One-off timers are left alone, because the testing
    // library waits on its own.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
}

/** Presses and types without a pause between, so it needs no timer. */
export const user = userEvent.setup({ delay: null });

/** Lets what was just done be saved and drawn. */
export async function settle(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

/**
 * Lets `ms` pass on the app's clock, and `timersMs` for its timers: all of
 * it by default, or a second when only the next tick of a display matters.
 */
export async function pass(clock: FixedClock, ms: number, timersMs: number = ms): Promise<void> {
  clock.elapseMs(ms);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(timersMs);
  });
}

export const seconds = (count: number) => count * 1000;
export const minutes = (count: number) => count * 60000;

/** Turns the drums of the dialog that asks for a time of day ("19:15"), and confirms it. */
export async function enterTime(title: string, value: string): Promise<void> {
  const dialog = await screen.findByRole('dialog', { name: title });
  await turnClock(dialog, clockTurnOf(value));
  await user.click(within(dialog).getByRole('button', { name: 'OK' }));
  await settle();
}

/** Brings the calendar that asks for a day to `value` ("2026-10-02"), and confirms it. */
export async function enterDate(value: string): Promise<void> {
  await pickDate(value);
  await settle();
}

/**
 * Turns the drums of the clock time entry of a set, or of the one `title`
 * names: `hour` on the twelve-hour clock, with `period` where it matters.
 * With `confirm` false the dialog is left open.
 */
export async function enterClock(
  hour: number,
  minute: number,
  second = 0,
  {
    period,
    confirm = true,
    title = /^Set (started|ended)$/,
  }: { period?: 'AM' | 'PM'; confirm?: boolean; title?: string | RegExp } = {},
): Promise<HTMLElement> {
  const dialog = await screen.findByRole('dialog', { name: title });
  await turnClock(dialog, { hour, minute, second, period });
  if (confirm) {
    await user.click(within(dialog).getByRole('button', { name: 'OK' }));
    await settle();
  }
  return dialog;
}
