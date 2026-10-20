import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { SleepNight } from '../../src/domain/SleepNight';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-250: a night of sleep typed on Progress, beside the nights read from the health platform. */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;

const two = (value: number) => String(value).padStart(2, '0');
const iso = (date: CalendarDate) => `${date.year}-${two(date.month)}-${two(date.day)}`;

/** A watch that recorded two sessions last night, and one the night before. */
function watchHistory(): string {
  const yesterday = today.addDays(-1);
  const events = [
    `{"op": "add", "type": "sleep", "id": "s-1", "value": 180, "start": "${iso(yesterday)}T23:10:00", "end": "${iso(today)}T02:10:00", "source": "watch"}`,
    `{"op": "add", "type": "sleep", "id": "s-2", "value": 230, "start": "${iso(today)}T02:30:00", "end": "${iso(today)}T06:20:00", "source": "watch"}`,
    `{"op": "add", "type": "sleep", "id": "s-3", "value": 400, "start": "${iso(today.addDays(-2))}T23:00:00", "end": "${iso(yesterday)}T05:40:00", "source": "watch"}`,
  ];
  return `{"sources": [{"id": "watch", "name": "Watch"}], "events": [${events.join(',')}]}`;
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

let section: HTMLElement;

async function openSleep(): Promise<void> {
  renderApp(repos, today);
  await openTab('Progress');
  section = (await screen.findByRole('heading', { name: 'Sleep' })).closest('.mm-section') as HTMLElement;
  // Folded to its line once last night is recorded (MM-257); open when it is not.
  if (within(section).queryByRole('button', { name: 'Save night' }) === null) {
    await userEvent.click(within(section).getByRole('button', { name: /^Sleep/ }));
  }
}

const hours = () => within(section).getByRole<HTMLInputElement>('textbox', { name: /, hours/ });
const minutes = () => within(section).getByRole<HTMLInputElement>('textbox', { name: /, minutes/ });
const stored = () => first(repos.sleep.watchSleepNights());

async function type(h: string, m: string): Promise<void> {
  await userEvent.clear(hours());
  await userEvent.type(hours(), h);
  await userEvent.clear(minutes());
  await userEvent.type(minutes(), m);
}

it('7 h 20 m typed for last night is kept as 440 minutes, typed, and said on the line', async () => {
  await openSleep();
  expect(within(section).getByText('Last night not recorded yet.')).toBeInTheDocument();
  expect(within(section).getByText('0 of the last 14 nights recorded.')).toBeInTheDocument();
  await type('7', '20');
  await userEvent.click(within(section).getByRole('button', { name: 'Save night' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  const [night] = await stored();
  expect(night?.date).toBe(today);
  expect(night?.minutesAsleep).toBe(440);
  expect(night?.source).toBe('typed');
  expect(await within(section).findByText('Last night 7 h 20 m.')).toBeInTheDocument();
  expect(within(section).getByText('1 of the last 14 nights recorded.')).toBeInTheDocument();
});

it('imported sessions make one night, and a typed value for that night is used instead', async () => {
  const source = FakeHealthSource.fromJson(watchHistory());
  await source.permit(new Set(['sleep']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('sleep');
  await openSleep();
  // Two sessions summed, kept against the morning they ended on, with the watch named.
  expect(within(section).getByText('Last night 6 h 50 m, from Watch.')).toBeInTheDocument();
  expect(within(section).getByRole('button', { name: 'The night before · 6 h 40 m' })).toBeInTheDocument();
  expect(within(section).getByText(/^Last night: 6 h 50 m from Watch\. A night you type is used instead\.$/)).toBeInTheDocument();
  expect([hours().value, minutes().value]).toEqual(['6', '50']);

  await type('7', '20');
  await userEvent.click(within(section).getByRole('button', { name: 'Save night' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  expect((await stored())[0]?.minutesAsleep).toBe(440);
  expect(await within(section).findByText('Last night 7 h 20 m.')).toBeInTheDocument();
  // The import is kept, not used: another read changes nothing.
  await new HealthImporter({ source, store: repos.healthSamples }).import('sleep');
  expect((await stored())[0]?.source).toBe('typed');
  expect(within(section).getByText(/A night you type is used instead of one read from Health Connect\.$/)).toBeInTheDocument();
});

it('any night of the last fourteen can be typed, and a mistyped value is refused in place', async () => {
  await repos.sleep.saveSleepNight(new SleepNight({ date: today, minutesAsleep: 420, source: 'typed' }));
  await openSleep();
  await userEvent.click(within(section).getByRole('button', { name: /^The night before/ }));
  expect([hours().value, minutes().value]).toEqual(['', '']);
  await type('25', '0');
  expect(within(section).getByText('Up to 24 hours.')).toBeInTheDocument();
  expect(within(section).getByRole('button', { name: 'Save night' })).toBeDisabled();
  await type('6', '75');
  expect(within(section).getByText('Minutes from 0 to 59.')).toBeInTheDocument();
  await type('6', '5');
  await userEvent.click(within(section).getByRole('button', { name: 'Save night' }));
  await expect.poll(async () => (await stored()).length).toBe(2);
  expect((await stored()).map((n) => [n.date, n.minutesAsleep])).toEqual([
    [today.addDays(-1), 365],
    [today, 420],
  ]);
  expect(within(section).getByText('2 of the last 14 nights recorded.')).toBeInTheDocument();
});
