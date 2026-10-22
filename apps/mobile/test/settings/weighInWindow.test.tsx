import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { WeighInWindow } from '../../src/healthIngest/WeighInWindow';
import { first } from '../support/first';
import { openEverySection, openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { turnClock } from '../support/pickers';
import { renderApp } from '../support/renderApp';

/**
 * MM-441: the weigh-in window is 04:00 to 12:00 until it is moved in
 * Settings, beside the primary scale; the reading MM-71 counts is then the
 * first one inside the moved window, and the window is kept.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let source: FakeHealthSource;

const two = (value: number) => String(value).padStart(2, '0');
const iso = (date: CalendarDate) => `${date.year}-${two(date.month)}-${two(date.day)}`;

/** One scale this morning at 09:00, in the afternoon at 15:10 and in the evening at 21:00. */
function threeReadings(): string {
  const reading = (id: string, time: string, value: number) =>
    `{"op": "add", "type": "weight", "id": "${id}", "value": ${value}, "start": "${iso(today)}T${time}:00", "source": "home"}`;
  return (
    `{"sources": [{"id": "home", "name": "Bathroom scale"}], "events": [` +
    `${reading('w1', '09:00', 81.2)}, ${reading('w2', '15:10', 82.4)}, ${reading('w3', '21:00', 83.1)}]}`
  );
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  source = FakeHealthSource.fromJson(threeReadings());
  await source.permit(new Set(['weight']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('weight');
});

const weighIn = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Today’s weigh-in' });

async function openProgress(): Promise<void> {
  renderApp(repos, today);
  await openTab('Progress');
  await screen.findByRole('heading', { name: 'Weight trend' });
}

it('with no window chosen, the reading in 04:00 to 12:00 counts', async () => {
  await openProgress();
  await expect.poll(() => weighIn().value).toBe('81.2');
});

it('with the window moved to 14:00 to 22:00, the 15:10 reading counts', async () => {
  await repos.weighInWindow.saveWeighInWindow(new WeighInWindow({ startMinute: 14 * 60, endMinute: 22 * 60 }));
  await openProgress();
  await expect.poll(() => weighIn().value).toBe('82.4');
});

it('Settings moves the window to the minute, refuses an end before the start, and keeps it', async () => {
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
  const settings = await openSettings();
  await expect
    .poll(async () => {
      await openEverySection();
      return settings.queryAllByText('Weigh-in window').length;
    })
    .toBe(1);
  const row = () => settings.getByText('Weigh-in window').closest('.mm-list-row');
  expect(row()?.textContent).toContain('4:00 AM to 12:00 PM, the usual morning.');

  await userEvent.click(settings.getByRole('button', { name: 'Change weigh-in window' }));
  const starts = await screen.findByRole('dialog', { name: 'Weigh-in window starts' });
  await turnClock(starts, { hour: 2, minute: 5, period: 'PM' });
  await userEvent.click(within(starts).getByRole('button', { name: 'OK' }));

  const ends = await screen.findByRole('dialog', { name: 'Weigh-in window ends' });
  // 9:00 AM, before the start. A 9, since a 1 typed here would join the 12 typed next into 11.
  await turnClock(ends, { hour: 9, minute: 0, period: 'AM' });
  expect(within(ends).getByRole('alert')).toHaveTextContent('Choose a time after 2:05 PM, or 12:00 AM for midnight.');
  await turnClock(ends, { hour: 12, minute: 0, period: 'AM' });
  await userEvent.click(within(ends).getByRole('button', { name: 'OK' }));

  await expect
    .poll(async () => {
      const kept = await first(repos.weighInWindow.watchWeighInWindow());
      return [kept.startMinute, kept.endMinute];
    })
    .toEqual([14 * 60 + 5, 24 * 60]);
  await expect.poll(() => row()?.textContent ?? '').toContain('2:05 PM to midnight.');
});

it('moved back to 4:00 AM to 12:00 PM, it is the usual window again', async () => {
  await repos.weighInWindow.saveWeighInWindow(new WeighInWindow({ startMinute: 14 * 60, endMinute: 22 * 60 }));
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
  const settings = await openSettings();
  await expect
    .poll(async () => {
      await openEverySection();
      return settings.queryAllByText('Weigh-in window').length;
    })
    .toBe(1);

  await userEvent.click(settings.getByRole('button', { name: 'Change weigh-in window' }));
  const starts = await screen.findByRole('dialog', { name: 'Weigh-in window starts' });
  await turnClock(starts, { hour: 4, minute: 0, period: 'AM' });
  await userEvent.click(within(starts).getByRole('button', { name: 'OK' }));
  const ends = await screen.findByRole('dialog', { name: 'Weigh-in window ends' });
  await turnClock(ends, { hour: 12, minute: 0, period: 'PM' });
  await userEvent.click(within(ends).getByRole('button', { name: 'OK' }));

  const row = () => settings.getByText('Weigh-in window').closest('.mm-list-row');
  await expect.poll(() => row()?.textContent ?? '').toContain('4:00 AM to 12:00 PM, the usual morning.');
});
