import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { SleepNight } from '../../src/domain/SleepNight';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-578: every section of Progress but the photos carries a graphic, and
 * with nothing to draw it says so in the graphic's place, with how far
 * along where it needs more than one record.
 */
const today = CalendarDate.of(2026, 10, 13);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
});

async function section(title: string): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Progress');
  return (await screen.findByRole('heading', { name: new RegExp(`^${title}`) })).closest('.mm-section') as HTMLElement;
}

async function open(title: string): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Progress');
  // Its header is a button once what it folds has been read.
  const header = await screen.findByRole('button', { name: new RegExp(`^${title}`) });
  await userEvent.click(header);
  return header.closest('.mm-section') as HTMLElement;
}

it('with no weigh-in, the trend chart’s place says what starts it', async () => {
  renderApp(repos, today);
  await openTab('Progress');
  expect(await screen.findByText('No trend yet. Your first weigh-in starts it.')).toBeInTheDocument();
});

it('with no waist measured, the chart’s place says the line starts from the third, 0 of 3', async () => {
  await repos.weights.saveWeight(today, 82);
  const waist = await open('Waist');
  expect(within(waist).getByRole('heading', { name: 'Waist over time' })).toBeInTheDocument();
  expect(within(waist).getByText(/^No measurements yet\. Each one is a dot here/)).toBeInTheDocument();
  expect(within(waist).getByText('0 of 3 measurements')).toBeInTheDocument();
});

it('weight events in the trend’s range are dots on its days, named aloud', async () => {
  await repos.weights.saveWeight(today, 82);
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-5), type: 'travel' });
  const events = await open('Weight events');
  const track = await within(events).findByRole('img', { name: /^Weight events over the last 30 days: Travel, / });
  expect(track.querySelectorAll('.chart-track-mark')).toHaveLength(1);
});

it('an event older than the trend’s range is listed, and the line says none is in range', async () => {
  await repos.weights.saveWeight(today, 82);
  await repos.weightEvents.saveWeightEvent({ date: today.addDays(-60), type: 'travel' });
  const events = await open('Weight events');
  expect(await within(events).findByText(/^None in the last 30 days, the trend chart’s range/)).toBeInTheDocument();
  expect(within(events).getByText('Travel')).toBeInTheDocument();
});

it('with no night recorded, sleep says so under its open slots, 0 of 14', async () => {
  await repos.weights.saveWeight(today, 82);
  const sleep = await section('Sleep');
  expect(await within(sleep).findByText('No nights recorded in the last 14 yet, 0 of 14. Tap a night to type it.')).toBeInTheDocument();
  const chart = within(sleep).getByRole('img', { name: /^Hours asleep, the last 14 nights: 0 recorded\./ });
  expect(chart.querySelectorAll('.chart-night-missing')).toHaveLength(14);
});

it('a recorded night is a bar; the others are open slots', async () => {
  await repos.weights.saveWeight(today, 82);
  await repos.sleep.saveSleepNight(new SleepNight({ date: today.addDays(-1), minutesAsleep: 420, source: 'typed' }));
  // Last night not recorded: the section is open already.
  const sleep = await section('Sleep');
  const chart = await within(sleep).findByRole('img', { name: /^Hours asleep, the last 14 nights: 1 recorded\./ });
  expect(chart.querySelectorAll('.chart-night')).toHaveLength(1);
  expect(chart.querySelectorAll('.chart-night-missing')).toHaveLength(13);
});

it('with no workout finished, strength trends opened says what starts its lines', async () => {
  await repos.weights.saveWeight(today, 82);
  const strength = await open('Strength trends');
  expect(await within(strength).findByText(/^No strength history yet\. Finish a workout in Train/)).toBeInTheDocument();
});

it('with no site beyond the waist, more measurements opened says what starts its lines', async () => {
  await repos.weights.saveWeight(today, 82);
  const more = await open('More measurements');
  expect(await within(more).findByText(/^No site beyond the waist yet\./)).toBeInTheDocument();
});
