import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { FakeHealthSource } from '../../src/healthIngest/testing/FakeHealthSource';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';

/**
 * MM-68, MM-73: connecting is offered at onboarding's weight question, never
 * required. Allowed, weight is read with its history, so the trend starts
 * from it, and today's weigh-in is offered as the current weight.
 */
const today = CalendarDate.of(2026, 10, 10);

/** A scale's weigh-in at 07:00 on each of the `days` days up to today, 82.4 kg this morning. */
function scale(days: number, { todayToo = true }: { todayToo?: boolean } = {}): FakeHealthSource {
  const events = [];
  for (let ago = days - 1; ago >= (todayToo ? 0 : 1); ago--) {
    events.push({
      op: 'add',
      type: 'weight',
      id: `w-${ago}`,
      value: ago === 0 ? 82.4 : 83,
      start: `${today.addDays(-ago).toString()}T07:00:00`,
      source: 'scale',
    });
  }
  return FakeHealthSource.fromJson(JSON.stringify({ sources: [{ id: 'scale', name: 'Bathroom scale' }], events }));
}

const next = () => screen.getByRole('button', { name: 'Next' });
const press = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }));
const type = (label: string, text: string) => userEvent.type(screen.getByRole('textbox', { name: label }), text);
const weightField = () => screen.getByRole<HTMLInputElement>('textbox', { name: 'lb' });

/** Opens onboarding on its weight question, with `source` as the phone's health platform. */
async function toMeasurements(source?: FakeHealthSource): Promise<InMemoryRepositories> {
  const repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  renderApp(repos, today, source === undefined ? {} : { change: (services) => ({ ...services, healthSource: source }) });
  await userEvent.click(await screen.findByRole('button', { name: 'Begin' }));
  await press('Male');
  await userEvent.click(next());
  await press(/Choose a date/);
  await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'OK' }));
  await userEvent.click(next());
  await type('Feet', '5');
  await type('Inches', '11');
  return repos;
}

/** Goes from the weight question to the app. */
async function finish(): Promise<void> {
  await userEvent.click(next()); // measurements
  await userEvent.click(next()); // activity
  await userEvent.click(next()); // training
  await userEvent.click(next()); // health
  await userEvent.click(next()); // the goal
  await press('Start');
  await screen.findByRole('button', { name: 'Menu' });
}

it('six months of scale data are read when connecting during onboarding', async () => {
  const source = scale(183);
  const repos = await toMeasurements(source);
  await press(/^Read weight from Health Connect/);
  // Every weigh-in of the six months is kept for the trend.
  await expect.poll(async () => (await repos.healthSamples.samples('weight')).length).toBe(183);
  const oldest = Math.min(...(await repos.healthSamples.samples('weight')).map((s) => s.start.getTime()));
  expect(oldest).toBe(new Date(`${today.addDays(-182).toString()}T07:00:00`).getTime());
  await type('lb', '200');
  await finish();
});

it('with the history refused, the last thirty days are read', async () => {
  const source = scale(183);
  const window = new Date(`${today.addDays(-30).toString()}T00:00:00`);
  source.historyFrom = window;
  source.willPermitHistory = false;
  const repos = await toMeasurements(source);
  await press(/^Read weight from Health Connect/);
  await screen.findByRole('button', { name: /^Use 181\.7 lb/ });
  await expect.poll(async () => (await repos.healthSamples.samples('weight')).length).toBe(31);
  const samples = await repos.healthSamples.samples('weight');
  expect(samples.every((s) => s.start.getTime() >= window.getTime())).toBe(true);
});

it('today’s imported weigh-in is offered as the current weight, and is not typed over', async () => {
  const repos = await toMeasurements(scale(10));
  expect(next(), 'no weight yet').toBeDisabled();
  await press(/^Read weight from Health Connect/);
  // The row pressed goes away: the weight field takes focus, so a reader goes on from there.
  await expect.poll(() => weightField()).toHaveFocus();
  await press(/^Use 181\.7 lb/);
  expect(weightField().value).toBe('181.7');
  // The Use row goes away too: focus is on the field it filled.
  await expect.poll(() => weightField()).toHaveFocus();
  expect(screen.getByText('Today’s weigh-in from Bathroom scale, in Health Connect. Type to change it.')).toBeInTheDocument();
  expect(next()).toBeEnabled();
  await finish();
  // Today's weigh-in is the import's: nothing typed stands over it (MM-71).
  expect(await first(repos.weights.watchWeights())).toEqual([]);
});

it('a weight typed over the offer is the person’s own', async () => {
  const repos = await toMeasurements(scale(10));
  await press(/^Read weight from Health Connect/);
  await press(/^Use 181\.7 lb/);
  await userEvent.clear(weightField());
  await type('lb', '180');
  expect(screen.getByText('This becomes your first weigh-in.')).toBeInTheDocument();
  await finish();
  const typed = await first(repos.weights.watchWeights());
  expect(typed.map((w) => w.date)).toEqual([today]);
});

it('with nothing weighed today, the weight is typed as before', async () => {
  await toMeasurements(scale(10, { todayToo: false }));
  await press(/^Read weight from Health Connect/);
  expect(await screen.findByText('No weigh-in in Health Connect today')).toBeInTheDocument();
  expect(weightField()).toHaveFocus();
  expect(screen.queryByRole('button', { name: /^Use / })).toBeNull();
});

it('refused, nothing is read and the weight is typed as before', async () => {
  const source = scale(10);
  source.willPermit = new Set();
  const repos = await toMeasurements(source);
  await press(/^Read weight from Health Connect/);
  expect(await screen.findByText(/Weight was not allowed/)).toBeInTheDocument();
  expect(await repos.healthSamples.samples('weight')).toEqual([]);
  await type('lb', '200');
  expect(next()).toBeEnabled();
});

it('without a health platform on the phone, nothing is offered', async () => {
  await toMeasurements();
  expect(screen.queryByRole('button', { name: /Read weight from/ })).toBeNull();
});
