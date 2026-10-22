import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import { RecoveryCheckIn } from '../../src/domain/RecoveryCheckIn';
import { ReminderKind } from '../../src/domain/ReminderKind';
import { ReminderSetting } from '../../src/domain/ReminderSetting';
import { InMemoryExactAlarms } from '../../src/fixtures/InMemoryExactAlarms';
import { InMemoryReminderScheduler } from '../../src/fixtures/InMemoryReminderScheduler';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { reminderPrompt } from '../../src/format/reminderPrompt';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { giveTime, openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/** MM-146: reminders the user chooses, that give up politely. Carried over from reminders_test.dart. */
// A Monday. The fixed clock reads noon.
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let scheduler: InMemoryReminderScheduler;
let exactAlarms: InMemoryExactAlarms;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  scheduler = new InMemoryReminderScheduler();
  exactAlarms = new InMemoryExactAlarms();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today.addDays(-1), 82);
});

async function open(): Promise<void> {
  renderApp(repos, today, { change: (services) => ({ ...services, reminderScheduler: scheduler, exactAlarms }) });
  await screen.findByRole('navigation', { name: 'Destinations' });
}

const stored = () => first(repos.reminders.watchReminders());

it('no notification carries health data or pressure', () => {
  for (const kind of ReminderKind.values) {
    const prompt = reminderPrompt(kind).toLowerCase();
    expect(prompt).not.toMatch(/\d/);
    for (const word of [
      'kcal',
      'calorie',
      'weight ',
      'lb',
      'kg',
      'target',
      'streak',
      'missed',
      'days',
      'you ',
      'your ',
      "don't",
      'forget',
    ]) {
      expect(prompt, `${prompt} / ${word}`).not.toContain(word);
    }
    expect(prompt.endsWith('?'), 'a plain prompt').toBe(true);
  }
});

it('nothing is on, scheduled or asked for until the user acts', async () => {
  await open();
  const settings = await openSettings();
  expect(await stored()).toEqual([]);
  expect(scheduler.permissionRequests).toBe(0);
  expect(scheduler.scheduled).toEqual([]);
  // MM-248: never on first run, and no exact-alarm question before reminders are opened.
  expect(exactAlarms.asked).toBe(false);
  expect(exactAlarms.settingOpened).toBe(0);
  for (const name of [/^Weigh-in/, /^Log food/]) {
    expect(settings.getByRole('switch', { name })).not.toBeChecked();
  }
});

it('turning one on asks for permission, then schedules it', async () => {
  await open();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^Weigh-in/ }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  expect(scheduler.permissionRequests).toBe(1);
  const setting = (await stored())[0];
  expect(setting?.enabled).toBe(true);
  expect(setting?.minuteOfDay).toBe(7 * 60);
  // 7 am has passed.
  expect(setting?.countFrom).toBe(today.addDays(1));
  // It is noon: seven mornings from tomorrow.
  await expect.poll(() => scheduler.scheduled.length).toBe(7);
  expect(scheduler.scheduled[0]?.date).toBe(today.addDays(1));
  expect(scheduler.scheduled.every((r) => r.kind === 'weighIn')).toBe(true);
  expect(await settings.findByRole('button', { name: /^At 7:00 AM/ })).toBeInTheDocument();
});

it('a refused permission leaves it off and says why', async () => {
  scheduler.grantPermission = false;
  await open();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^Weigh-in/ }));
  expect(await screen.findByText(/Notifications are off/)).toBeInTheDocument();
  expect(await stored()).toEqual([]);
  expect(scheduler.scheduled).toEqual([]);
});

it('turning it off cancels what was scheduled', async () => {
  await open();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^Log food/ }));
  // 8 pm today is still ahead.
  await expect.poll(() => scheduler.scheduled[0]?.date).toBe(today);
  await userEvent.click(settings.getByRole('switch', { name: /^Log food/ }));
  await expect.poll(async () => (await stored())[0]?.enabled).toBe(false);
  await expect.poll(() => scheduler.scheduled.length).toBe(0);
});

it('the time can be changed, but not to the night', async () => {
  await open();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^Weigh-in/ }));
  await userEvent.click(await settings.findByRole('button', { name: /^At 7:00 AM/ }));
  await giveTime('08:30');
  await expect.poll(async () => (await stored())[0]?.minuteOfDay).toBe(8 * 60 + 30);
  await userEvent.click(await settings.findByRole('button', { name: /^At 8:30 AM/ }));
  const dialog = await giveTime('23:00');
  // The picker itself says the range and will not take the time (MM-264).
  expect(within(dialog).getByRole('alert')).toHaveTextContent('Choose a time between 7:00 AM and 8:59 PM.');
  expect(within(dialog).getByRole('button', { name: 'OK' })).toBeDisabled();
  await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect((await stored())[0]?.minuteOfDay).toBe(8 * 60 + 30);
});

/** MM-248: reminders on the minute, the exact-alarm permission asked for once, with its reason. */
describe('on the minute', () => {
  const reason = 'So a reminder arrives at the time you set.';

  it('granted: the row says "On the minute", and nothing is asked', async () => {
    await open();
    const settings = await openSettings();
    await userEvent.click(settings.getByRole('switch', { name: /^Weigh-in/ }));
    expect(await settings.findByText('On the minute')).toBeInTheDocument();
    expect(screen.queryByText(reason)).toBeNull();
    expect(exactAlarms.settingOpened).toBe(0);
  });

  it('asked once, with the reason before the phone’s own page', async () => {
    exactAlarms = new InMemoryExactAlarms({ held: false });
    await open();
    const settings = await openSettings();
    await userEvent.click(settings.getByRole('switch', { name: /^Weigh-in/ }));
    expect(await screen.findByText(reason)).toBeInTheDocument();
    // The reason first: the phone's page has not been opened yet.
    expect(exactAlarms.settingOpened).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: 'Open phone settings' }));
    expect(await settings.findByText('On the minute')).toBeInTheDocument();
    expect(exactAlarms.settingOpened).toBe(1);
    await userEvent.click(settings.getByRole('switch', { name: /^Log food/ }));
    await expect.poll(async () => (await stored()).filter((setting) => setting.enabled).length).toBe(2);
    expect(screen.queryByText(reason)).toBeNull();
    expect(exactAlarms.settingOpened).toBe(1);
  });

  it('declined: within an hour, the same plan, and the way to the phone’s setting', async () => {
    exactAlarms = new InMemoryExactAlarms({ held: false, allowInSetting: false });
    await open();
    const settings = await openSettings();
    await userEvent.click(settings.getByRole('switch', { name: /^Weigh-in/ }));
    await screen.findByText(reason);
    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    await expect.poll(() => screen.queryByText(reason)).toBeNull();
    // Nothing else changes: the reminder is on and the same seven are planned.
    expect((await stored())[0]?.enabled).toBe(true);
    await expect.poll(() => scheduler.scheduled.length).toBe(7);
    expect(exactAlarms.settingOpened).toBe(0);
    expect(await settings.findByRole('button', { name: /^Within an hour/ })).toBeInTheDocument();
    // Not asked again when another is turned on.
    await userEvent.click(settings.getByRole('switch', { name: /^Log food/ }));
    await expect.poll(async () => (await stored()).filter((setting) => setting.enabled).length).toBe(2);
    expect(screen.queryByText(reason)).toBeNull();
    // The row opens the phone's setting itself, without the question.
    await userEvent.click(settings.getByRole('button', { name: /^Within an hour/ }));
    await expect.poll(() => exactAlarms.settingOpened).toBe(1);
    expect(screen.queryByText(reason)).toBeNull();
  });

  it('a reminder turned on before it was asked: the row asks, with the reason', async () => {
    exactAlarms = new InMemoryExactAlarms({ held: false });
    await repos.reminders.saveReminder(
      new ReminderSetting({ kind: 'weighIn', enabled: true, minuteOfDay: 7 * 60, countFrom: today }),
    );
    await open();
    const settings = await openSettings();
    await userEvent.click(await settings.findByRole('button', { name: /^Within an hour/ }));
    expect(await screen.findByText(reason)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open phone settings' }));
    expect(await settings.findByText('On the minute')).toBeInTheDocument();
  });
});

const foodReminder = () =>
  repos.reminders.saveReminder(
    new ReminderSetting({ kind: 'logFood', enabled: true, minuteOfDay: 20 * 60, countFrom: today }),
  );

it('logging food cancels today’s food reminder', async () => {
  await foodReminder();
  await open();
  await expect.poll(() => scheduler.scheduled[0]?.date).toBe(today);
  await repos.food.addFood(foodOn(today, { name: 'Lunch', meal: 'lunch', kcal: 600, proteinG: 40, carbsG: 60, fatG: 20 }));
  await expect.poll(() => scheduler.scheduled[0]?.date).toBe(today.addDays(1));
});

it('a pause silences its days', async () => {
  await foodReminder();
  const pause = new Pause({ from: today, to: today.addDays(4), reason: 'travel' });
  await repos.pauses.savePause(pause);
  await open();
  await expect.poll(() => scheduler.scheduled.length).toBeGreaterThan(0);
  expect(scheduler.scheduled.some((r) => pause.covers(r.date))).toBe(false);
});

/** MM-116's reminder: once a week, on the day the five questions fall due. */
it('the recovery check-in reminder waits for its day, and answering moves it a week on', async () => {
  await open();
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('switch', { name: /^How you are holding up/ }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  expect((await stored())[0]?.minuteOfDay).toBe(9 * 60);
  // Setup was 200 days ago: it falls due every seventh day from then, next in three days.
  await expect.poll(() => scheduler.scheduled[0]?.date).toBe(today.addDays(3));
  expect(scheduler.scheduled.every((r) => r.kind === 'recoveryCheckIn' && r.minuteOfDay === 9 * 60)).toBe(true);
  await repos.recovery.saveRecoveryCheckIn(
    new RecoveryCheckIn({ date: today, hunger: 3, energy: 3, sleep: 3, training: 3, mood: 3 }),
  );
  await expect.poll(() => scheduler.scheduled[0]?.date).toBe(today.addDays(7));
});

describe('ignored for a week', () => {
  /**
   * The last weigh-in three weeks ago, so a weigh-in reminder has gone
   * unanswered. Three weeks without a record is also a gap (MM-147), so
   * food is logged every day to keep the dashboard in front.
   */
  beforeEach(async () => {
    repos = new InMemoryRepositories();
    await repos.preferences.saveThemePreference('martian');
    await repos.setup.saveSetup(
      typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
    );
    await repos.weights.saveWeight(today.addDays(-20), 82);
    await repos.reminders.saveReminder(
      new ReminderSetting({ kind: 'weighIn', enabled: true, minuteOfDay: 7 * 60, countFrom: today.addDays(-9) }),
    );
    for (let day = 0; day <= 19; day++) {
      await repos.food.addFood(
        foodOn(today.addDays(-day), { name: 'Lunch', meal: 'lunch', kcal: 2000, proteinG: 140, carbsG: 200, fatG: 70 }),
      );
    }
  });

  const asks = 'Weigh-in reminders are paused. Keep them or turn them off?';

  it('nothing more is scheduled, and the app asks once', async () => {
    await open();
    expect(await screen.findByText(asks)).toBeInTheDocument();
    expect(scheduler.scheduled).toEqual([]);
  });

  it('Keep starts them again', async () => {
    await open();
    await screen.findByText(asks);
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
    await expect.poll(() => screen.queryByText(asks)).toBeNull();
    expect((await stored())[0]?.countFrom).toBe(today.addDays(1));
    await expect.poll(() => scheduler.scheduled.length).toBeGreaterThan(0);
  });

  it('weighing in starts them again, without the question', async () => {
    await repos.weights.saveWeight(today, 81.8);
    await open();
    await expect.poll(() => scheduler.scheduled.length).toBeGreaterThan(0);
    expect(screen.queryByText(asks)).toBeNull();
  });

  it('Turn off turns them off', async () => {
    await open();
    await screen.findByText(asks);
    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));
    await expect.poll(() => screen.queryByText(asks)).toBeNull();
    expect((await stored())[0]?.enabled).toBe(false);
    expect(scheduler.scheduled).toEqual([]);
  });
});
