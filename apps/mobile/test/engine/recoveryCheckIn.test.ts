import { expect, it } from 'vitest';
import { CalendarDate, RecoveryCheckIn } from '../../src/domain';
import { recoveryCheckInDue } from '../../src/engine';

/** MM-116: when the weekly recovery check-in is offered. */
const today = CalendarDate.of(2026, 10, 5);

const answered = (daysAgo: number) =>
  new RecoveryCheckIn({ date: today.addDays(-daysAgo), hunger: 3, energy: 3, sleep: 3, training: 3, mood: 3 });

const due = ({
  onboardedDaysAgo = 30,
  checkIns = [],
  skippedDaysAgo,
  paused = false,
}: {
  onboardedDaysAgo?: number;
  checkIns?: RecoveryCheckIn[];
  skippedDaysAgo?: number;
  paused?: boolean;
} = {}) =>
  recoveryCheckInDue({
    today,
    onboardedOn: today.addDays(-onboardedDaysAgo),
    checkIns,
    skippedOn: skippedDaysAgo === undefined ? undefined : today.addDays(-skippedDaysAgo),
    paused,
  });

it('is offered once a week has passed since setup', () => {
  expect(due({ onboardedDaysAgo: 6 })).toBe(false);
  expect(due({ onboardedDaysAgo: 7 })).toBe(true);
});

it('is not offered again in the week it was answered', () => {
  expect(due({ checkIns: [answered(0)] })).toBe(false);
  expect(due({ checkIns: [answered(6)] })).toBe(false);
  expect(due({ checkIns: [answered(7)] })).toBe(true);
});

it('a skip lasts the week and no longer', () => {
  expect(due({ skippedDaysAgo: 0 })).toBe(false);
  expect(due({ skippedDaysAgo: 6 })).toBe(false);
  expect(due({ skippedDaysAgo: 7 })).toBe(true);
});

it('an old answer and an old skip do not hold it back', () => {
  expect(due({ checkIns: [answered(30), answered(14)], skippedDaysAgo: 21 })).toBe(true);
});

it('is not offered during a pause', () => {
  expect(due({ paused: true })).toBe(false);
});
