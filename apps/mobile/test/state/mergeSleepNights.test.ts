import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { SleepNight } from '../../src/domain/SleepNight';
import type { NightOfSleep } from '../../src/healthIngest/NightOfSleep';
import { mergeSleepNights } from '../../src/state/mergeSleepNights';

/** MM-250: the nights the app works from: typed over imported, as MM-71 rules for weight. */
const today = CalendarDate.of(2026, 10, 6);
const night = (date: CalendarDate, minutes: number, sourceName = 'Watch'): NightOfSleep => ({
  day: new Date(date.year, date.month - 1, date.day),
  minutes,
  sourceName,
  sessions: 1,
});

it('a typed night wins over an import for the same morning, and the rest are imported', () => {
  const merged = mergeSleepNights({
    typed: [new SleepNight({ date: today, minutesAsleep: 440, source: 'typed' })],
    imported: [night(today.addDays(-1), 390), night(today, 400)],
    today,
  });
  expect(merged.map((n) => [n.date, n.minutesAsleep, n.source, n.sourceName])).toEqual([
    [today.addDays(-1), 390, 'imported', 'Watch'],
    [today, 440, 'typed', undefined],
  ]);
});

it('an imported night that cannot be a night, or is after today, is left out; an unnamed source is no name', () => {
  const merged = mergeSleepNights({
    typed: [],
    imported: [night(today.addDays(1), 400), night(today, 0), night(today.addDays(-1), 25 * 60), night(today.addDays(-2), 410, '')],
    today,
  });
  expect(merged.map((n) => [n.date, n.minutesAsleep, n.sourceName])).toEqual([[today.addDays(-2), 410, undefined]]);
});
