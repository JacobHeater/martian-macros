import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { first } from '../support/first';
import { openEverySection, openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-71: the primary scale is the one with the most weigh-ins until the
 * person names one in Settings; then its readings count first, and
 * "Automatic" goes back.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let source: FakeHealthSource;

const two = (value: number) => String(value).padStart(2, '0');
const iso = (date: CalendarDate) => `${date.year}-${two(date.month)}-${two(date.day)}`;

/** A bathroom scale every morning for ten days, and the gym’s scale this morning and twice before. */
function twoScales(): string {
  const events: string[] = [];
  for (let d = 9; d >= 0; d--) {
    events.push(
      `{"op": "add", "type": "weight", "id": "home-${d}", "value": ${d === 0 ? 81.4 : 82}, ` +
        `"start": "${iso(today.addDays(-d))}T06:42:00", "source": "home"}`,
    );
  }
  for (const d of [0, 3, 6]) {
    events.push(
      `{"op": "add", "type": "weight", "id": "gym-${d}", "value": 83.6, "start": "${iso(today.addDays(-d))}T07:30:00", "source": "gym"}`,
    );
  }
  return `{"sources": [{"id": "home", "name": "Bathroom scale"}, {"id": "gym", "name": "Gym scale"}], "events": [${events.join(',')}]}`;
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  source = FakeHealthSource.fromJson(twoScales());
  await source.permit(new Set(['weight']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('weight');
});

/** Whether `text` is in Settings, opening the Health Connect section once it is drawn (after the first read). */
async function shown(text: string | RegExp): Promise<boolean> {
  await openEverySection();
  return screen.queryAllByText(text).length > 0;
}

const weighIn = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Today’s weigh-in' });

async function openProgress(): Promise<void> {
  renderApp(repos, today);
  await openTab('Progress');
  await screen.findByRole('heading', { name: 'Weight trend' });
}

it('until one is chosen, the scale with the most weigh-ins counts', async () => {
  await openProgress();
  await expect.poll(() => weighIn().value).toBe('81.4');
  expect(screen.getByText(/^From Bathroom scale at 6:42 AM\./)).toBeInTheDocument();
});

it('a scale chosen counts first, even with fewer weigh-ins', async () => {
  await repos.preferences.savePrimaryScale('gym');
  await openProgress();
  await expect.poll(() => weighIn().value).toBe('83.6');
  expect(screen.queryByText(/From Bathroom scale/)).not.toBeInTheDocument();
});

it('Settings names the scale in force, chooses another, and goes back to Automatic', async () => {
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
  const settings = await openSettings();
  await expect.poll(() => shown('Primary scale')).toBe(true);
  const row = () => settings.getByText('Primary scale').closest('.mm-list-row');
  await expect
    .poll(() => row()?.textContent ?? '')
    .toContain('Automatic: Bathroom scale, with the most weigh-ins in 30 days.');

  await userEvent.click(settings.getByRole('button', { name: 'Change primary scale' }));
  await userEvent.click(await screen.findByRole('option', { name: 'Gym scale' }));
  await expect.poll(async () => first(repos.preferences.watchPrimaryScale())).toBe('gym');
  await expect.poll(() => row()?.textContent ?? '').toContain('Gym scale. Its weigh-ins count before any other source’s.');

  await userEvent.click(settings.getByRole('button', { name: 'Change primary scale' }));
  await userEvent.click(await screen.findByRole('option', { name: 'Automatic' }));
  await expect.poll(async () => first(repos.preferences.watchPrimaryScale())).toBeUndefined();
});

it('weigh-ins from one scale only: no primary scale to choose', async () => {
  const one = FakeHealthSource.fromJson(
    `{"sources": [{"id": "home", "name": "Bathroom scale"}], "events": [
      {"op": "add", "type": "weight", "id": "w1", "value": 82, "start": "${iso(today)}T06:42:00", "source": "home"}
    ]}`,
  );
  await one.permit(new Set(['weight']));
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await new HealthImporter({ source: one, store: repos.healthSamples }).import('weight');
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: one }) });
  const settings = await openSettings();
  await expect.poll(() => shown(/1 reading from Bathroom scale/)).toBe(true);
  expect(settings.queryByText('Primary scale')).not.toBeInTheDocument();
});
