import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import type { WeightDisplay } from '../../src/domain/WeightDisplay';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-118: coached by the weight without having to look at it. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

/** A body weight in any unit, as a screen would print it. */
const weightFigure = /\d+(\.\d+)? ?(kg|lb)\b/;
/** Today's reading, far enough off the trend that no trend figure prints it. */
const todaysReading = 84.3;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** Three weeks of a cut, weighed daily, losing half a kilogram a week, with today's reading off the trend. */
async function threeWeeks({
  display,
  eatingDisorderHistory = false,
  weighedToday = true,
}: { display?: WeightDisplay; eatingDisorderHistory?: boolean; weighedToday?: boolean } = {}) {
  const setup = typicalSetup({
    goalMode: 'fatLoss',
    onboardedOn: today.addDays(-35),
    healthCheckConfirmedOn: today,
    screening: new ScreeningAnswers({ eatingDisorderHistory }),
  });
  await repos.setup.saveSetup(setup.copyWith({ unitSystem: 'metric' }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-21), { kcal: 2100, tdeeKcal: 2600 }));
  for (let i = 1; i <= 21; i++) await repos.weights.saveWeight(today.addDays(-i), 80 + (i * 0.5) / 7 + (i % 2 === 0 ? 0.3 : -0.3));
  if (weighedToday) await repos.weights.saveWeight(today, todaysReading);
  if (display !== undefined) await repos.preferences.saveWeightDisplay(display);
}

const dots = () => document.querySelectorAll('.chart-trend circle').length;

it('Trend only: the chart is a line and band with no dots, and no raw reading appears', async () => {
  await threeWeeks({ display: 'trendOnly' });
  renderApp(repos, today);
  expect(await screen.findByText(/^Trend [\d.]+ kg$/)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(`${todaysReading}`);
  await openTab('Progress');
  await screen.findByText(/last 7 days/);
  expect(document.querySelector('.chart-trend')).not.toBeNull();
  expect(dots()).toBe(0);
  expect(document.body.textContent).not.toContain(`${todaysReading}`);
  expect(screen.getByRole('textbox', { name: 'Today’s weigh-in' })).toHaveValue('');
});

it('Switching back: with Everything the full history of readings is shown', async () => {
  await threeWeeks({ display: 'trendOnly' });
  await repos.preferences.saveWeightDisplay('everything');
  renderApp(repos, today);
  expect(await screen.findByText(new RegExp(`^Today ${todaysReading} kg`))).toBeInTheDocument();
  await openTab('Progress');
  await screen.findByText(/last 7 days/);
  expect(dots()).toBeGreaterThan(20);
});

it('Hidden: no screen shows a weight in any unit, and the dashboard says the pace in words', async () => {
  await threeWeeks({ display: 'hidden' });
  renderApp(repos, today);
  expect(await screen.findByText(/^(So far, )?(on pace|On pace|slower than planned|Slower than planned|faster than planned|Faster than planned|steady|Steady)$/)).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(weightFigure);
  for (const tab of ['Progress', 'Coach']) {
    await openTab(tab);
    await screen.findByText(tab === 'Progress' ? /Against your plan’s pace/ : 'Your metabolism');
    expect(document.body.textContent, tab).not.toMatch(weightFigure);
  }
  expect(document.querySelector('.chart-trend')).toBeNull();
});

it('The coach still works: with the weight hidden, what it works out is what it works out with Everything', async () => {
  const metabolism = async () => {
    renderApp(repos, today);
    await openTab('Coach');
    const heading = await screen.findByRole('heading', { name: 'Your metabolism' });
    return (heading.closest('.mm-section') as HTMLElement).textContent;
  };
  await threeWeeks({ display: 'hidden' });
  const hidden = await metabolism();
  cleanup();
  await repos.preferences.saveWeightDisplay('everything');
  expect(await metabolism()).toBe(hidden);
});

it('a weigh-in typed with the trend only is confirmed with "Saved" and no echo', async () => {
  await threeWeeks({ display: 'trendOnly', weighedToday: false });
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), `${todaysReading}`);
  await userEvent.click(screen.getByRole('button', { name: 'Save weigh-in' }));
  expect(await screen.findByText('Saved')).toBeInTheDocument();
  expect(screen.queryByText(/^Saved .* for today$/)).not.toBeInTheDocument();
  await expect.poll(async () => (await first(repos.weights.watchWeights())).some((w) => w.date === today)).toBe(true);
});

it('Default for eating-disorder history: Trend only, said, and changeable', async () => {
  await threeWeeks({ eatingDisorderHistory: true });
  renderApp(repos, today);
  expect(await screen.findByText(/^Trend [\d.]+ kg$/)).toBeInTheDocument();
  expect(document.body.textContent).not.toContain(`${todaysReading}`);
  const settings = await openSettings();
  const row = (await settings.findByText('Weight display')).closest('.mm-list-row') as HTMLElement;
  expect(within(row).getByText('Trend only')).toBeInTheDocument();
  await userEvent.click(within(row).getByRole('button', { name: 'Change weight display' }));
  const sheet = await screen.findByRole('dialog', { name: 'Weight display' });
  expect(within(sheet).getByText('Your backup and any export still contain the numbers.')).toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: /^Everything/ }));
  await expect.poll(async () => first(repos.preferences.watchWeightDisplay())).toBe('everything');
});

it('offered once, with no comment, after more than one weigh-in a day on five days in two weeks; remembered once answered', async () => {
  await threeWeeks({ weighedToday: false });
  const at = (daysAgo: number, hour: number) => {
    const day = today.addDays(-daysAgo);
    return new Date(day.year, day.month - 1, day.day, hour, 0);
  };
  await repos.healthSamples.upsert(
    [1, 3, 5, 7, 9].flatMap((d) =>
      [7, 8].map((hour) => ({
        platformId: `w-${d}-${hour}`,
        type: 'weight' as const,
        value: 80 + hour / 10,
        start: at(d, hour),
        sourceId: 'com.example.scale',
        sourceName: 'Scale',
      })),
    ),
  );
  renderApp(repos, today);
  const offer = (await screen.findByText('How much of your weight to show')).closest('.mm-notice') as HTMLElement;
  expect(offer.textContent).not.toMatch(/often|too much|a lot/i);
  await userEvent.click(within(offer).getByRole('button', { name: 'Not now' }));
  await expect.poll(async () => first(repos.preferences.watchWeightDisplayOffered())).toBe(true);
  expect(screen.queryByText('How much of your weight to show')).not.toBeInTheDocument();
  cleanup();
  renderApp(repos, today);
  await screen.findByRole('textbox', { name: 'Today’s weigh-in' });
  expect(screen.queryByText('How much of your weight to show')).not.toBeInTheDocument();
});
