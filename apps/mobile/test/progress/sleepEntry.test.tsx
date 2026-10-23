import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { SleepNight } from '../../src/domain/SleepNight';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { failing } from '../support/failing';
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

const hours = () => within(section).getByRole<HTMLInputElement>('textbox', { name: /, Hours$/ });
const minutes = () => within(section).getByRole<HTMLInputElement>('textbox', { name: /, Minutes$/ });
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
  expect(within(section).getByText('Last night: Not recorded yet.')).toBeInTheDocument();
  expect(within(section).getByText('No nights recorded in the last 14 yet, 0 of 14. Tap a night to type it.')).toBeInTheDocument();
  // Heard as the night and its part, once (the panel's F1).
  expect(hours()).toHaveAttribute('aria-label', 'Last night, Hours');
  await type('7', '20');
  await userEvent.click(within(section).getByRole('button', { name: 'Save night' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  const [night] = await stored();
  expect(night?.date).toBe(today);
  expect(night?.minutesAsleep).toBe(440);
  expect(night?.source).toBe('typed');
  expect(await within(section).findByText('Last night 7 h 20 m.')).toBeInTheDocument();
  expect(within(section).getByText('Last night: 7 h 20 m, typed.')).toBeInTheDocument();
  expect(within(section).getByText('1 of the last 14 nights recorded. Tap a night to type or correct it. The line is the 7-night average.')).toBeInTheDocument();
  // Said where the action was taken, and aloud (the panel's F2).
  expect(screen.getByRole('status')).toHaveTextContent('Saved: Last night, 7 h 20 m.');
});

const fromWatch = '2 of the last 14 nights recorded. Tap a night to type or correct it. The line is the 7-night average. A night you type is used instead of one read from Health Connect.';

it('imported sessions make one night, and a typed value for that night is used instead', async () => {
  const source = FakeHealthSource.fromJson(watchHistory());
  await source.permit(new Set(['sleep']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('sleep');
  await openSleep();
  // Two sessions summed, kept against the morning they ended on, with the watch named.
  expect(within(section).getByText('Last night 6 h 50 m, from Watch.')).toBeInTheDocument();
  expect(within(section).getByRole('img', { name: /The night before, 6 h 40 m/ })).toBeInTheDocument();
  expect(within(section).getByText('Last night: 6 h 50 m from Watch. Type to use yours instead.')).toBeInTheDocument();
  expect(within(section).getByText(fromWatch)).toBeInTheDocument();
  expect([hours().value, minutes().value]).toEqual(['6', '50']);

  await type('7', '20');
  await userEvent.click(within(section).getByRole('button', { name: 'Save night' }));
  await expect.poll(async () => (await stored()).length).toBe(1);
  expect((await stored())[0]?.minutesAsleep).toBe(440);
  expect(await within(section).findByText('Last night 7 h 20 m.')).toBeInTheDocument();
  // The import is kept, not used: another read changes nothing.
  await new HealthImporter({ source, store: repos.healthSamples }).import('sleep');
  expect((await stored())[0]?.source).toBe('typed');
  expect(within(section).getByText('Last night: 7 h 20 m, typed.')).toBeInTheDocument();
  expect(within(section).getByText(fromWatch)).toBeInTheDocument();
});

it('any night of the last fourteen can be typed, and a mistyped value is refused in place', async () => {
  await repos.sleep.saveSleepNight(new SleepNight({ date: today, minutesAsleep: 420, source: 'typed' }));
  await openSleep();
  // A night is chosen on the chart: a tap in its column (MM-578).
  await userEvent.click(section.querySelector('[data-ago="1"]') as Element);
  expect([hours().value, minutes().value]).toEqual(['', '']);
  await type('25', '0');
  expect(within(section).getByText('Up to 24 hours.')).toBeInTheDocument();
  expect(hours()).toHaveAttribute('aria-invalid', 'true');
  expect(minutes()).not.toHaveAttribute('aria-invalid', 'true');
  expect(within(section).getByRole('button', { name: 'Save night' })).toBeDisabled();
  // MM-414: the field whose value is wrong is the one marked.
  await type('6', '75');
  expect(within(section).getByText('Minutes from 0 to 59.')).toBeInTheDocument();
  expect(minutes()).toHaveAttribute('aria-invalid', 'true');
  expect(hours()).not.toHaveAttribute('aria-invalid', 'true');
  await type('24', '30');
  expect(within(section).getByText('Up to 24 hours in all.')).toBeInTheDocument();
  await type('0', '0');
  expect(within(section).getByText('Type the hours asleep.')).toBeInTheDocument();
  expect(within(section).getByRole('button', { name: 'Save night' })).toBeDisabled();
  await type('6', '5');
  await userEvent.click(within(section).getByRole('button', { name: 'Save night' }));
  await expect.poll(async () => (await stored()).length).toBe(2);
  expect((await stored()).map((n) => [n.date, n.minutesAsleep])).toEqual([
    [today.addDays(-1), 365],
    [today, 420],
  ]);
  expect(within(section).getByText('The night before: 6 h 5 m, typed.')).toBeInTheDocument();
  expect(within(section).getByText('2 of the last 14 nights recorded. Tap a night to type or correct it. The line is the 7-night average.')).toBeInTheDocument();
});

// The panel's F4: a read that went wrong is said, with a way to try again, never shown as no nights.
it('when the nights cannot be read the section says so and offers to try again', async () => {
  let fails = true;
  renderApp(repos, today, {
    change: (s) => ({
      ...s,
      sleep: {
        saveSleepNight: (night) => s.sleep.saveSleepNight(night),
        watchSleepNights: () => (fails ? failing() : s.sleep.watchSleepNights()),
      },
    }),
  });
  await openTab('Progress');
  section = (await screen.findByRole('heading', { name: 'Sleep' })).closest('.mm-section') as HTMLElement;
  expect(within(section).getByText('Could not read your nights of sleep')).toBeInTheDocument();
  expect(within(section).queryByText(/nights recorded/)).not.toBeInTheDocument();
  fails = false;
  await userEvent.click(within(section).getByRole('button', { name: 'Try again' }));
  expect(await within(section).findByText('Last night not recorded yet.')).toBeInTheDocument();
});

