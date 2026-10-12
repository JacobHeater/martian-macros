import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-93: Progress, waist and day-rollover behavior (MM-17, MM-21, MM-90).
 * Carried over from progress_flows_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
});

async function openProgress() {
  const view = renderApp(repos, today);
  await openTab('Progress');
  await screen.findByRole('heading', { name: 'Weight trend' });
  return view;
}

it('the trend chart draws readings, a line and a band', async () => {
  for (let d = 20; d >= 0; d--) {
    await repos.weights.saveWeight(today.addDays(-d), 83 - (20 - d) * 0.05 + (d % 2 === 0 ? 0.3 : -0.3));
  }
  await openProgress();
  const chart = await screen.findByRole('img', { name: /^Weight trend over the last 30 days\./ });
  expect(chart).toHaveAccessibleName(/from 21 weigh-ins\.$/);
  expect(chart.querySelectorAll('.chart-weigh-in')).toHaveLength(21);
  expect(chart.querySelector('.chart-band')).not.toBeNull();
  expect(chart.querySelector('.chart-estimate')).not.toBeNull();
});

it('the range control widens the trend to ninety days', async () => {
  for (let d = 60; d >= 0; d -= 2) await repos.weights.saveWeight(today.addDays(-d), 83);
  await openProgress();
  const within30 = (await screen.findByRole('img', { name: /last 30 days/ })).querySelectorAll('.chart-weigh-in').length;
  await userEvent.click(screen.getByRole('button', { name: '90d' }));
  const within90 = (await screen.findByRole('img', { name: /last 90 days/ })).querySelectorAll('.chart-weigh-in').length;
  expect(within30).toBe(15);
  expect(within90).toBe(31);
});

it('waist shows the latest measurement and the change', async () => {
  await repos.weights.saveWeight(today, 82);
  await repos.waist.saveWaist(today.addDays(-14), 90);
  await repos.waist.saveWaist(today, 88.5);
  await openProgress();
  // 90 cm to 88.5 cm is a fall of 0.6 in, shown to the quarter inch.
  expect(
    await screen.findByText(
      'Latest: 34.75 in on Oct 5. Down 0.5 in since you started. Weekly is enough: the next is due Oct 12.',
    ),
  ).toBeInTheDocument();
});

it('a waist difference inside the noise is no clear change', async () => {
  await repos.weights.saveWeight(today, 82);
  await repos.waist.saveWaist(today.addDays(-14), 90);
  await repos.waist.saveWaist(today, 89.2);
  await openProgress();
  expect(await screen.findByText(/No clear change since you started/)).toBeInTheDocument();
});

it('the waist start is the middle of the first three entries', async () => {
  await repos.weights.saveWeight(today, 82);
  for (const [ago, cm] of [
    [70, 94.0],
    [63, 92.0],
    [56, 92.5],
    [14, 90.0],
    [7, 90.0],
    [0, 90.0],
  ] as const) {
    await repos.waist.saveWaist(today.addDays(-ago), cm);
  }
  await openProgress();
  // 92.5 cm to 90 cm is 2.5 cm, an inch.
  expect(await screen.findByText(/Down 1 in since you started\./)).toBeInTheDocument();
});

it('a waist measurement can be saved from its card', async () => {
  await repos.weights.saveWeight(today, 82);
  await openProgress();
  await userEvent.type(screen.getByRole('textbox', { name: '1st waist reading' }), '35');
  const card = screen.getByRole('heading', { name: 'Waist' }).closest('.mm-surface') as HTMLElement;
  await userEvent.click(card.querySelector('.progress-waist-save button') as HTMLElement);
  await expect.poll(async () => (await first(repos.waist.watchWaist())).length).toBe(1);
  const saved = (await first(repos.waist.watchWaist()))[0];
  expectClose(saved?.waistCm ?? 0, 88.9, 0.1);
  expect(saved?.date).toBe(today);
});

it('the day rolls over while the app is open', async () => {
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(
    foodOn(today, { name: 'Chicken and rice', meal: 'lunch', kcal: 510, proteinG: 45, carbsG: 60, fatG: 10 }),
  );
  const view = renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('Chicken and rice')).toBeInTheDocument();
  // Midnight passes while the app is in the background.
  view.clock.advanceTo(today.addDays(1));
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => screen.queryByText('Chicken and rice'), { message: 'a new day' }).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  expect(await screen.findByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
  expect(await screen.findByText('Chicken and rice')).toBeInTheDocument();
});

/** MM-112, from health_recheck_test.dart: the Progress half of the bariatric case. */
it('bariatric surgery suppresses targets but keeps measurements available', async () => {
  await repos.setup.saveSetup(
    typicalSetup({
      screening: new ScreeningAnswers({ bariatricSurgery: true }),
      onboardedOn: today,
      healthCheckConfirmedOn: today,
    }),
  );
  await repos.weights.saveWeight(today, 80);
  await openProgress();
  expect(await screen.findByText('Trend weight')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Today’s weigh-in' })).toBeInTheDocument();
  expect(await first(repos.targets.watchTargetsHistory())).toEqual([]);
});
