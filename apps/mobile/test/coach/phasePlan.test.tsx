import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-36: the Coach shows the phase, about when it ends, and once it has ended the next one. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** A man in `goal` since `daysAgo`, his own body fat `percent`, weighed daily and losing `kgPerWeek` (gaining when negative). */
async function phase({
  goal = 'fatLoss',
  percent,
  daysAgo,
  kgPerWeek = 0.5,
  eatingDisorderHistory = false,
}: {
  goal?: 'fatLoss' | 'leanGain';
  percent: number;
  daysAgo: number;
  kgPerWeek?: number;
  eatingDisorderHistory?: boolean;
}): Promise<void> {
  const setup = typicalSetup({
    goalMode: goal,
    onboardedOn: today.addDays(-daysAgo - 14),
    healthCheckConfirmedOn: today,
    screening: new ScreeningAnswers({ eatingDisorderHistory }),
  });
  await repos.setup.saveSetup(setup.copyWith({ bodyFatPercent: percent }));
  await repos.targets.saveTargets(
    targetsFrom(today.addDays(-daysAgo), goal === 'fatLoss' ? { kcal: 2100, tdeeKcal: 2600 } : { mode: 'leanGain', kcal: 2800, tdeeKcal: 2600, weeklyRateFraction: 0.0025 }),
  );
  for (let i = 0; i <= 28; i++) await repos.weights.saveWeight(today.addDays(-i), 80 + (i * kgPerWeek) / 7);
}

const goalSection = async () => (await screen.findByRole('heading', { name: /^Goal:/ })).closest('.mm-section') as HTMLElement;

it('a steady cut toward its goal shows how long it has run and about when the goal is reached', async () => {
  await phase({ percent: 20, daysAgo: 14 });
  renderApp(repos, today);
  await openTab('Coach');
  const section = await goalSection();
  expect(within(section).getByText('This phase')).toBeInTheDocument();
  expect(within(section).getByText('2 weeks')).toBeInTheDocument();
  expect(within(section).getByText('Projected end')).toBeInTheDocument();
  expect(within(section).getByText(/^About \w+ 20\d\d$/)).toBeInTheDocument();
  expect(within(section).getByText('At your current pace, when the lower end of your body-fat range reaches 15%.')).toBeInTheDocument();
});

it('a man cut to 12% is recommended maintenance, then a lean gain, says why, and the goal changes only when he takes it', async () => {
  await phase({ percent: 12, daysAgo: 70 });
  renderApp(repos, today);
  await openTab('Coach');
  const section = await goalSection();
  const notice = within(section).getByText('Next: Maintenance, then Lean gain').closest('.mm-notice') as HTMLElement;
  expect(within(notice).getByText(/^The lower end of your body-fat range has reached 15%, this cut’s goal\./)).toBeInTheDocument();
  expect((await first(repos.setup.watchSetup()))?.goalMode).toBe('fatLoss');
  await userEvent.click(within(notice).getByRole('button', { name: 'Start maintenance' }));
  await screen.findByRole('heading', { name: 'Goal: Maintenance' });
  expect((await first(repos.setup.watchSetup()))?.goalMode).toBe('maintenance');
});

it('with an eating-disorder history the phase shows, and nothing is projected or recommended from body fat', async () => {
  // A gain at 19%, whose range would otherwise end it (MM-129's line); a deficit is not offered with this history.
  await phase({ goal: 'leanGain', percent: 19, daysAgo: 70, kgPerWeek: -0.25, eatingDisorderHistory: true });
  renderApp(repos, today);
  await openTab('Coach');
  const section = await goalSection();
  expect(within(section).getByText('This phase')).toBeInTheDocument();
  expect(within(section).queryByText('Projected end')).not.toBeInTheDocument();
  expect(within(section).queryByText(/^Next:/)).not.toBeInTheDocument();
});
