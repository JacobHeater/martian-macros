import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-73: a new user's history is read when they connect, as far back as
 * the platform allows, up to a year.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;
let source: FakeHealthSource;

const two = (n: number) => String(n).padStart(2, '0');
const iso = (date: CalendarDate) => `${date.year}-${two(date.month)}-${two(date.day)}`;

/** A scale that weighed every morning for six months up to yesterday. Every reading is made up. */
function sixMonths(): string {
  const events: string[] = [];
  for (let d = 180; d >= 1; d--) {
    events.push(
      `{"op": "add", "type": "weight", "id": "w-${d}", "value": ${80 + d * 0.01}, ` +
        `"start": "${iso(today.addDays(-d))}T06:42:00", "source": "scale"}`,
    );
  }
  return `{"sources": [{"id": "scale", "name": "Bathroom scale"}], "events": [${events.join(',')}]}`;
}

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  source = FakeHealthSource.fromJson(sixMonths());
  // Health Connect's window: the thirty days before the first grant.
  source.historyFrom = new Date(2026, 8, 5);
});

const stored = async () => (await repos.healthSamples.samples('weight')).length;

async function allowWeight() {
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('button', { name: /^Weight/ }));
  return settings;
}

it('connecting with the history granted keeps the six months', async () => {
  await allowWeight();
  await expect.poll(stored).toBe(180);
  expect(source.historyAsked).toBe(1);
  // What the user typed is not touched by it.
  expect(await first(repos.weights.watchWeights())).toEqual([]);
});

it('the history refused: the last thirty days, and it is not asked for again', async () => {
  source.willPermitHistory = false;
  const settings = await allowWeight();
  await expect.poll(stored).toBe(30);
  await userEvent.click(await settings.findByRole('button', { name: 'Read from Health Connect now' }));
  expect(source.historyAsked).toBe(1);
  expect(await stored()).toBe(30);
  expect(await repos.healthSamples.backfilledFrom('weight')).toBeUndefined();
});

it('history granted before the app opens is read as it opens', async () => {
  await source.permit(new Set(['weight']));
  source.permitHistory();
  renderApp(repos, today, { change: (services) => ({ ...services, healthSource: source }) });
  await openTab('Progress');
  await expect.poll(stored).toBe(180);
  expect(await repos.healthSamples.backfilledFrom('weight')).toBeDefined();
});
