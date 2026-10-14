import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { HealthImporter } from '../../src/healthIngest/HealthImporter';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-68 and MM-71: imported weigh-ins become the app's weigh-ins, and a
 * typed value overrules them. Carried over from imported_weigh_ins_test.dart:
 * what the screens do with weigh-ins that have been imported. Reading the
 * health platform as the app opens is with the health import's own tests,
 * and how the two are merged is in test/state/mergeWeighIns.test.ts.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

const two = (value: number) => String(value).padStart(2, '0');
const iso = (date: CalendarDate) => `${date.year}-${two(date.month)}-${two(date.day)}`;

/** A scale that weighed every morning for `days` up to today, and once again this evening. */
function scaleHistory(days = 10, todayKg = 81.4): string {
  const events: string[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const kg = d === 0 ? todayKg : 82 + d * 0.05;
    events.push(
      `{"op": "add", "type": "weight", "id": "w-${d}", "value": ${kg}, ` +
        `"start": "${iso(today.addDays(-d))}T06:42:00", "source": "scale"}`,
    );
  }
  events.push(
    `{"op": "add", "type": "weight", "id": "evening", "value": 83.0, "start": "${iso(today)}T21:10:00", "source": "scale"}`,
  );
  return `{"sources": [{"id": "scale", "name": "Bathroom scale"}], "events": [${events.join(',')}]}`;
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  const source = FakeHealthSource.fromJson(scaleHistory());
  await source.permit(new Set(['weight']));
  await new HealthImporter({ source, store: repos.healthSamples }).import('weight');
});

async function openProgress(): Promise<void> {
  renderApp(repos, today);
  await openTab('Progress');
  await screen.findByRole('heading', { name: 'Weight trend' });
}

const weighIn = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'Today’s weigh-in' });

it('today’s weigh-in is the scale’s morning reading, with where it came from', async () => {
  await openProgress();
  await expect.poll(() => weighIn().value).toBe('81.4');
  expect(
    screen.getByText('From Bathroom scale at 6:42 AM. Type a value to use yours instead.'),
  ).toBeInTheDocument();
  expect(await repos.healthSamples.samples('weight')).toHaveLength(11);
  // Nothing imported is written among what the user typed.
  expect(await first(repos.weights.watchWeights())).toEqual([]);
});

it('the trend is made from the imported weigh-ins', async () => {
  await openProgress();
  const chart = await screen.findByRole('img', { name: /^Weight trend over the last 30 days\./ });
  expect(chart).toHaveAccessibleName(/from 10 weigh-ins\.$/);
  expect(chart.querySelectorAll('.chart-weigh-in')).toHaveLength(10);
  expect(screen.queryByText('Log a weigh-in to start your trend.')).not.toBeInTheDocument();
});

it('typing a value for today overrules the import, which is kept', async () => {
  await openProgress();
  await expect.poll(() => weighIn().value).toBe('81.4');
  await userEvent.clear(weighIn());
  await userEvent.type(weighIn(), '80.9');
  const hero = screen.getByRole('heading', { name: 'Today’s weigh-in' }).closest('.mm-hero') as HTMLElement;
  await userEvent.click(within(hero).getByRole('button', { name: 'Save' }));
  await expect.poll(async () => (await first(repos.weights.watchWeights())).length).toBe(1);
  await expect.poll(() => weighIn().value).toBe('80.9');
  expect(screen.queryByText(/From Bathroom scale/)).not.toBeInTheDocument();
  expect((await first(repos.weights.watchWeights()))[0]?.weightKg).toBe(80.9);
  expect(await repos.healthSamples.samples('weight')).toHaveLength(11);
});

it('with nothing imported, nothing is shown as imported', async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await openProgress();
  expect(weighIn()).toHaveValue('');
  expect(screen.getByText('First thing in the morning, after the bathroom.')).toBeInTheDocument();
});
