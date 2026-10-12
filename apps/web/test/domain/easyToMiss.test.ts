import { expect, it } from 'vitest';
import { CalendarDate, EasyToMissPreference, easyToMissVisible } from '../../src/domain';

/** MM-152: when the easy-to-miss line appears. */
const start = CalendarDate.of(2026, 9, 1);

const visible = (
  dayOfUse: number,
  { lastShown, enabled = true, suppressed = false }: { lastShown?: CalendarDate; enabled?: boolean; suppressed?: boolean } = {},
) =>
  easyToMissVisible({
    today: start.addDays(dayOfUse - 1),
    onboardedOn: start,
    preference: new EasyToMissPreference({ enabled, lastShown }),
    suppressed,
  });

it('shown every time in the first 14 days', () => {
  expect(visible(1)).toBe(true);
  expect(visible(3)).toBe(true);
  expect(visible(14, { lastShown: start.addDays(12) })).toBe(true);
});

it('not shown the day after it was shown once past day 14', () => {
  expect(visible(30, { lastShown: start.addDays(28) })).toBe(false);
  expect(visible(30, { lastShown: start.addDays(23) })).toBe(false);
});

it('shown again once a week has passed', () => {
  expect(visible(30, { lastShown: start.addDays(22) })).toBe(true);
  expect(visible(30), 'never shown').toBe(true);
});

it('stays visible for the rest of the day it first appeared on', () => {
  expect(visible(30, { lastShown: start.addDays(29) })).toBe(true);
});

it('never when turned off or suppressed', () => {
  expect(visible(3, { enabled: false })).toBe(false);
  expect(visible(30, { enabled: false })).toBe(false);
  expect(visible(3, { suppressed: true })).toBe(false);
});
