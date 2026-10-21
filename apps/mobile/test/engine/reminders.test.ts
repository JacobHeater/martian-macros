import { describe, expect, it } from 'vitest';
import { CalendarDate, Pause, ReminderKind, ReminderSetting } from '../../src/domain';
import { planReminders, reminderCountFrom, ReminderFacts, reminderIgnoredStreak, ReminderRule } from '../../src/engine';

/** MM-146: reminders the user chooses, that give up politely. */
// A Monday, so the first Sunday ahead is six days on.
const today = CalendarDate.of(2026, 10, 5);
const sevenAm = 7 * 60;
const eightPm = 20 * 60;

const on = (
  kind: ReminderKind,
  { minute, since = 0, enabled = true }: { minute?: number; since?: number; enabled?: boolean } = {},
) =>
  new ReminderSetting({
    kind,
    enabled,
    minuteOfDay: minute ?? ReminderRule.defaultMinuteOfDay(kind),
    countFrom: today.addDays(-since),
  });

const plan = (
  settings: readonly ReminderSetting[],
  { facts, minuteNow = 6 * 60 }: { facts?: ReminderFacts; minuteNow?: number } = {},
) => planReminders({ settings, facts: facts ?? new ReminderFacts(), today, minuteNow });

it('nothing is on by default, so nothing is planned', () => {
  expect(plan([])).toEqual([]);
  expect(plan(ReminderKind.values.map((kind) => on(kind, { enabled: false })))).toEqual([]);
});

it('the defaults are 7 am, 8 pm and Sunday 8 am', () => {
  expect(ReminderRule.defaultMinuteOfDay('weighIn')).toBe(sevenAm);
  expect(ReminderRule.defaultMinuteOfDay('logFood')).toBe(eightPm);
  const weekly = plan([on('weeklyMeasurement')]);
  expect(weekly[0]?.date).toBe(CalendarDate.of(2026, 10, 11));
  expect(weekly[0]?.minuteOfDay).toBe(8 * 60);
  expect(
    weekly.every((r) => today.daysUntil(r.date) % 7 === 6),
    'Sundays only',
  ).toBe(true);
});

describe('a weigh-in reminder', () => {
  it('is planned for 7 am today when there is no weigh-in yet', () => {
    const planned = plan([on('weighIn')]);
    expect(planned[0]).toEqual({ kind: 'weighIn', date: today, minuteOfDay: sevenAm });
  });

  it('is not sent today after a weigh-in at 6:40', () => {
    const planned = plan([on('weighIn')], {
      facts: new ReminderFacts({ weighInDays: [today] }),
      minuteNow: 6 * 60 + 40,
    });
    expect(planned.some((r) => r.date === today)).toBe(false);
    expect(planned[0]?.date).toBe(today.addDays(1));
  });

  it('is not planned for today once its time has passed', () => {
    const planned = plan([on('weighIn')], { minuteNow: 9 * 60 });
    expect(planned[0]?.date).toBe(today.addDays(1));
  });
});

describe('a reminder that is ignored', () => {
  it('has seven sends and then stops', () => {
    expect(plan([on('weighIn')])).toHaveLength(7);
  });

  it('is not sent on the eighth day', () => {
    const setting = on('weighIn', { since: 7 });
    expect(reminderIgnoredStreak({ setting, facts: new ReminderFacts(), today, minuteNow: 6 * 60 })).toBe(7);
    expect(plan([setting])).toEqual([]);
  });

  it('a user away for 30 days has heard nothing since it stopped', () => {
    const setting = on('weighIn', { since: 30 });
    expect(plan([setting])).toEqual([]);
    expect(plan([setting, on('logFood', { since: 30 })])).toEqual([]);
  });

  it('each send that goes unanswered shortens what is planned', () => {
    expect(plan([on('weighIn', { since: 3 })])).toHaveLength(4);
  });

  it('doing the thing starts the count again', () => {
    const setting = on('weighIn', { since: 30 });
    const facts = new ReminderFacts({ weighInDays: [today.addDays(-1)] });
    expect(reminderIgnoredStreak({ setting, facts, today, minuteNow: 6 * 60 })).toBe(0);
    expect(plan([setting], { facts })).toHaveLength(7);
  });

  it('keeping it starts the count again from that day', () => {
    const kept = on('weighIn', { since: 30 }).copyWith({ countFrom: today });
    expect(plan([kept])).toHaveLength(7);
  });

  it('a weekly one stops after seven Sundays', () => {
    expect(plan([on('weeklyMeasurement')])).toHaveLength(7);
    expect(plan([on('weeklyMeasurement', { since: 50 })])).toEqual([]);
  });
});

it('the weekly measurement is skipped when the waist was measured', () => {
  const planned = plan([on('weeklyMeasurement')], {
    facts: new ReminderFacts({ waistDays: [CalendarDate.of(2026, 10, 8)] }),
  });
  // Measured on Thursday: that still counts on Sunday the 11th, so the
  // first reminder is the Sunday after.
  expect(planned[0]?.date).toBe(CalendarDate.of(2026, 10, 18));
});

it('at most two a day, and the weekly one is kept', () => {
  const planned = plan([on('weighIn'), on('logFood'), on('weeklyMeasurement')]);
  const perDay = new Map<CalendarDate, number>();
  for (const r of planned) {
    perDay.set(r.date, (perDay.get(r.date) ?? 0) + 1);
  }
  expect([...perDay.values()].every((n) => n <= ReminderRule.dailyCap)).toBe(true);
  const sunday = planned.filter((r) => r.date === CalendarDate.of(2026, 10, 11));
  expect(sunday.map((r) => r.kind)).toEqual(['weighIn', 'weeklyMeasurement']);
});

it('nothing is sent in the quiet period', () => {
  expect(plan([on('weighIn', { minute: 6 * 60 + 30 })])).toEqual([]);
  expect(plan([on('logFood', { minute: 21 * 60 })])).toEqual([]);
  expect(plan([on('logFood', { minute: 20 * 60 + 59 })]).length).toBeGreaterThan(0);
});

it('a pause silences everything for its days', () => {
  const pause = new Pause({ from: today.addDays(1), to: today.addDays(4), reason: 'travel' });
  const planned = plan([on('weighIn'), on('logFood')], { facts: new ReminderFacts({ pauses: [pause] }) });
  expect(planned.some((r) => pause.covers(r.date))).toBe(false);
  expect(planned.some((r) => r.date === today)).toBe(true);
});

it('paused days do not count as ignored', () => {
  const pause = new Pause({ from: today.addDays(-10), to: today.addDays(-1), reason: 'illness' });
  expect(
    reminderIgnoredStreak({
      setting: on('weighIn', { since: 12 }),
      facts: new ReminderFacts({ pauses: [pause] }),
      today,
      minuteNow: 6 * 60,
    }),
  ).toBe(2);
});

it('turned on after its time, today does not count as ignored', () => {
  expect(reminderCountFrom({ today, minuteNow: 720, minuteOfDay: sevenAm })).toBe(today.addDays(1));
  expect(reminderCountFrom({ today, minuteNow: 360, minuteOfDay: sevenAm })).toBe(today);
});

it('the plan is in time order', () => {
  const planned = plan([on('logFood'), on('weighIn')]);
  for (let i = 1; i < planned.length; i++) {
    const a = planned[i - 1];
    const b = planned[i];
    if (a === undefined || b === undefined) throw new Error('unreachable');
    expect(a.date.isBefore(b.date) || (a.date === b.date && a.minuteOfDay <= b.minuteOfDay)).toBe(true);
  }
});

describe('the most pending at once (MM-405: iOS keeps only the soonest 64)', () => {
  it('keeps the soonest when the plan holds more', () => {
    const settings = [on('weighIn'), on('logFood'), on('weeklyMeasurement')];
    const all = planReminders({ settings, facts: new ReminderFacts(), today, minuteNow: 6 * 60 });
    const few = planReminders({ settings, facts: new ReminderFacts(), today, minuteNow: 6 * 60, mostPending: 5 });
    expect(all.length).toBeGreaterThan(5);
    expect(few).toEqual(all.slice(0, 5));
  });

  it('every plan the rules allow fits what iOS keeps', () => {
    const settings = ReminderKind.values.map((kind) => on(kind));
    expect(plan(settings).length).toBeLessThanOrEqual(64);
    expect(ReminderRule.mostPending).toBe(64);
  });
});
