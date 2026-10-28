import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { foodOn } from '../support/foodOn';
import { openCoach } from '../support/openCoach';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-142: a weigh-in's explanation on the Progress chart, at the point the person taps. */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-40), { kcal: 2200 }));
  for (let daysAgo = 40; daysAgo >= 1; daysAgo--) {
    const day = today.addDays(-daysAgo);
    await repos.weights.saveWeight(day, 82 + (daysAgo % 2 === 0 ? 0.1 : -0.1));
    await repos.food.addFood(foodOn(day, { kcal: 2200, carbsG: daysAgo === 1 ? 340 : 230 }));
    await repos.dayMarks.setCompleteness(day, 'complete');
  }
});

async function openProgress() {
  renderApp(repos, today);
  await openCoach();
  return screen.findByRole('img', { name: /^Weight trend over the last 30 days\./ });
}

it('the latest weigh-in, when far from the trend, is explained under the chart without a tap', async () => {
  await repos.weights.saveWeight(today, 83.3);
  await openProgress();
  const line = await screen.findByText(/^Today’s weigh-in is [\d.]+ kg above your trend\./);
  expect(line).toHaveTextContent('Likely cause: carbohydrate yesterday, 340 g against your usual 230 g.');
  // Nothing was picked, so the reading is not said twice.
  expect(document.querySelector('.progress-weigh-in-picked')).toBeNull();
});

it('a latest weigh-in inside the noise shows nothing under the chart', async () => {
  await repos.weights.saveWeight(today, 82.1);
  await openProgress();
  expect(document.querySelector('.progress-weigh-in-note')).toBeNull();
});

it('tapping a dot says that reading and its distance from the trend; a dot inside the noise is said to be', async () => {
  await repos.weights.saveWeight(today, 83.3);
  const chart = await openProgress();
  // Day 0 of the range is 29 days ago: an ordinary reading.
  const dot = chart.querySelector('[data-day="0"]') as Element;
  await userEvent.click(dot);
  const picked = await screen.findByText(/^Mon, Sep 21: 8[\d.]+ kg, [−+]?[\d.]+ kg from the trend, inside the day-to-day noise\.$/);
  expect(picked).toBeInTheDocument();
  expect(chart.querySelector('.chart-weigh-in-picked')?.getAttribute('data-day')).toBe('0');
  expect(screen.queryByText(/your trend\./)).not.toBeInTheDocument();
  // Back to today's dot: the explanation returns under a caption that says the reading once; the line has the distance.
  await userEvent.click(chart.querySelector('[data-day="29"]') as Element);
  expect(await screen.findByText('Today: 83.3 kg.')).toBeInTheDocument();
  expect(screen.getByText(/^Today’s weigh-in is [\d.]+ kg above your trend\./)).toBeInTheDocument();
  expect(screen.getByText(/add it under Weight events below|Likely cause/)).toBeInTheDocument();
});

it('the arrow keys move the pick between weigh-ins, Home and End to the ends', async () => {
  await repos.weights.saveWeight(today, 83.3);
  const chart = await openProgress();
  chart.focus();
  await userEvent.keyboard('{ArrowLeft}');
  // From the latest (today, day 29) one to the left: yesterday.
  expect(await screen.findByText(/^Yesterday: 8[\d.]+ kg, [−+]?[\d.]+ kg from the trend, inside the day-to-day noise\.$/)).toBeInTheDocument();
  await userEvent.keyboard('{Home}');
  expect(await screen.findByText(/^Mon, Sep 21: /)).toBeInTheDocument();
  await userEvent.keyboard('{ArrowLeft}');
  expect(screen.getByText(/^Mon, Sep 21: /)).toBeInTheDocument();
  await userEvent.keyboard('{End}');
  expect(await screen.findByText('Today: 83.3 kg.')).toBeInTheDocument();
});

it('changing the range forgets the picked reading', async () => {
  await repos.weights.saveWeight(today, 82.1);
  const chart = await openProgress();
  await userEvent.click(chart.querySelector('[data-day="0"]') as Element);
  await screen.findByText(/inside the day-to-day noise\.$/);
  await userEvent.click(screen.getByRole('button', { name: '90d' }));
  await screen.findByRole('img', { name: /last 90 days/ });
  expect(document.querySelector('.progress-weigh-in-note')).toBeNull();
});
