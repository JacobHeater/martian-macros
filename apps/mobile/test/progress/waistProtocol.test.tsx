import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';

/** MM-155: the protocol drawn for the first three measurements and one tap down after; the chart of the record. */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }));
  await repos.weights.saveWeight(today, 82);
});

const figureName = 'Drawing: where the tape sits, level around the waist at the navel.';

async function openWaist(): Promise<HTMLElement> {
  renderApp(repos, today);
  await openCoach();
  const card = (await screen.findByRole('heading', { name: 'Waist' })).closest('.mm-section') as HTMLElement;
  await userEvent.click(within(card).getByRole('button', { name: /^Waist/ }));
  return card;
}

it('before the third measurement the protocol is drawn in full, with the steps as its words', async () => {
  await repos.waist.saveWaist(today.addDays(-14), 92, { readings: [91.5, 92, 92.5] });
  await repos.waist.saveWaist(today.addDays(-7), 91.5, { readings: [91, 91.5, 92] });
  const card = await openWaist();
  expect(within(card).getByRole('img', { name: figureName })).toBeInTheDocument();
  expect(within(card).getByText('Tape level with the navel, snug and not pressing in.')).toBeInTheDocument();
  expect(within(card).queryByRole('button', { name: /^How to measure/ })).not.toBeInTheDocument();
  // Two measurements: dots alone, and the caption says the line comes from the third (the panel's PD-8).
  expect(within(card).getByText(/^Dots are measurements\. From the third,/)).toBeInTheDocument();
  expect(within(card).getByRole('img', { name: /^Waist over the last 90 days/ }).querySelector('.chart-line')).toBeNull();
});

it('from the third measurement the protocol is one tap down, and still there', async () => {
  for (const daysAgo of [21, 14, 7]) await repos.waist.saveWaist(today.addDays(-daysAgo), 92, { readings: [91.5, 92, 92.5] });
  const card = await openWaist();
  expect(within(card).queryByRole('img', { name: figureName })).not.toBeInTheDocument();
  await userEvent.click(within(card).getByRole('button', { name: /^How to measure/ }));
  expect(within(card).getByRole('img', { name: figureName })).toBeInTheDocument();
  expect(within(card).getByText('First thing in the morning, after the bathroom, before eating.')).toBeInTheDocument();
});

it('the chart of the record sits under the entry, over 90 days or a year', async () => {
  for (let week = 20; week >= 0; week--) await repos.waist.saveWaist(today.addDays(-7 * week), 94 - (20 - week) * 0.1, { readings: [93, 94, 95] });
  const card = await openWaist();
  const chart = within(card).getByRole('img', { name: /^Waist over the last 90 days\. Latest 92 cm, from 21 measurements\.$/ });
  expect(chart.querySelectorAll('.chart-waist-entry')).toHaveLength(13);
  await userEvent.click(within(card).getByRole('button', { name: '1y' }));
  expect(within(card).getByRole('img', { name: /^Waist over the last year\./ }).querySelectorAll('.chart-waist-entry')).toHaveLength(21);
  expect(within(card).getByText(/Dots are measurements\./)).toBeInTheDocument();
});

it('with no measurement there is no chart', async () => {
  const card = await openWaist();
  expect(within(card).queryByRole('group', { name: 'Waist range' })).not.toBeInTheDocument();
  expect(within(card).getByRole('img', { name: figureName })).toBeInTheDocument();
});
