import { expect, it } from 'vitest';
import { CalendarDate, type GoalMode, type MenstruationDay, RecoveryCheckIn, ScreeningAnswers } from '../../src/domain';
import { missedPeriodQuestion } from '../../src/engine';
import { typicalSetup } from '../../src/fixtures/typicalSetup';

/** MM-116: the check-in asks once whether a missed period is expected. */
const today = CalendarDate.of(2026, 10, 5);

/** Four days of flow starting each of `startsAgo` days before today. */
const periods = (...startsAgo: number[]): MenstruationDay[] =>
  startsAgo.flatMap((ago) => [0, 1, 2, 3].map((d) => ({ date: today.addDays(-ago + d) })));

/** Cycles about every 29 days, the last starting 46 days ago. */
const regular = periods(104, 75, 46);

const answered = (daysAgo: number) =>
  new RecoveryCheckIn({ date: today.addDays(-daysAgo), hunger: 3, energy: 3, sleep: 3, training: 3, mood: 3 });

const ask = ({
  sex = 'female',
  goal = 'fatLoss',
  screening = new ScreeningAnswers(),
  flowDays = regular,
  checkIns = [],
}: {
  sex?: 'female' | 'male';
  goal?: GoalMode;
  screening?: ScreeningAnswers;
  flowDays?: MenstruationDay[];
  checkIns?: RecoveryCheckIn[];
} = {}) => missedPeriodQuestion({ setup: typicalSetup({ sex, goalMode: goal, screening }), flowDays, checkIns, today });

it('a female profile on fat loss, cycles about every 29 days and none for 46, is asked, and "not sure" brings the notice', () => {
  const missed = ask();
  expect(missed?.daysSince).toBe(46);
  expect(missed?.lastStartOn).toBe(today.addDays(-46));
  expect(missed?.noticeIfNotSure).toBe(true);
});

it('a male profile is never asked', () => {
  expect(ask({ sex: 'male' })).toBeUndefined();
});

it('nor a profile past menopause', () => {
  expect(ask({ screening: new ScreeningAnswers({ menopause: true }) })).toBeUndefined();
});

it('is asked from 45 days, not before', () => {
  expect(ask({ flowDays: periods(102, 73, 44) })).toBeUndefined();
  expect(ask({ flowDays: periods(103, 74, 45) })?.daysSince).toBe(45);
});

it('needs a previously regular cycle: two whole cycles of 21 to 35 days', () => {
  expect(ask({ flowDays: periods(75, 46) }), 'one cycle').toBeUndefined();
  expect(ask({ flowDays: periods(136, 86, 46) }), 'a 50-day cycle').toBeUndefined();
  expect(ask({ flowDays: periods(80, 63, 46) }), 'a 17-day cycle').toBeUndefined();
  expect(ask({ flowDays: periods(116, 81, 46) }), 'two 35-day cycles').toBeDefined();
  expect(ask({ flowDays: [] })).toBeUndefined();
});

it('is asked once a gap: not after a check-in answered since it began to qualify', () => {
  expect(ask({ checkIns: [answered(7)] }), 'answered before day 45').toBeDefined();
  expect(ask({ checkIns: [answered(1)] }), 'answered on day 45').toBeUndefined();
  expect(ask({ checkIns: [answered(0)] }), 'today’s answer can be given again').toBeDefined();
});

it('a period marked since starts the count again', () => {
  expect(ask({ flowDays: [...regular, ...periods(17)] })).toBeUndefined();
});

it('off a deficit goal it still asks, but "not sure" brings no notice', () => {
  expect(ask({ goal: 'leanGain' })?.noticeIfNotSure).toBe(false);
  expect(ask({ goal: 'maintenance' })?.noticeIfNotSure).toBe(false);
  expect(ask({ goal: 'recomp' })?.noticeIfNotSure).toBe(true);
});
