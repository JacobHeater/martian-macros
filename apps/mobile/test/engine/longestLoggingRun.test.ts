import { expect, it } from 'vitest';
import { CalendarDate, Pause } from '../../src/domain';
import { longestLoggingRunOf } from '../../src/engine';

/** MM-92, MM-33: the month's longest logging run, by the Dashboard streak's rule. */
const from = CalendarDate.of(2026, 1, 1);
const to = from.addDays(27);

const run = (wholeDays: readonly number[], pauses: Pause[] = []) =>
  longestLoggingRunOf({ from, to, wholeDays: wholeDays.map((d) => from.addDays(d)), pauses });

const range = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, i) => first + i);

it('nothing logged is no run', () => {
  expect(run([])).toBe(0);
});

it('every day of the month is a run of 28', () => {
  expect(run(range(0, 27))).toBe(28);
});

it('one missed day in a week is forgiven, as on the Dashboard', () => {
  // Six days, a miss, then another: the run carries on.
  expect(run([...range(0, 5), 7])).toBe(7);
});

it('two missed days running break it, and the longer run is the one said', () => {
  // Days 0-9, misses on 10 and 11, then 12-17.
  expect(run([...range(0, 9), ...range(12, 17)])).toBe(10);
});

it('a second miss within a week breaks it; the run ending before it keeps its forgiven day', () => {
  // Days 0-9, misses on 10 and 12: the run ending on day 11 forgives day 10.
  expect(run([...range(0, 9), 11, ...range(13, 17)])).toBe(11);
});

it('days outside the month are not part of it', () => {
  const outside = longestLoggingRunOf({
    from,
    to,
    wholeDays: [...range(-10, -1), ...range(0, 4), ...range(28, 40)].map((d) => from.addDays(d)),
  });
  expect(outside).toBe(5);
});

it('a pause neither counts nor breaks the run', () => {
  const pause = new Pause({ from: from.addDays(5), to: from.addDays(11), reason: 'travel' });
  expect(run([...range(0, 4), ...range(12, 16)], [pause])).toBe(10);
});
