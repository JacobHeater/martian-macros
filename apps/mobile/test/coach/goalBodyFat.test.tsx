import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { BiologicalSex } from '../../src/domain/BiologicalSex';
import type { GoalMode } from '../../src/domain/GoalMode';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { targetsFrom } from '../support/targetsFrom';

/** MM-507: a goal body fat set from the Coach's goal section, checked against the floors and kept across restarts. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

/** Six weeks into a cut at `percent` body fat, weighed daily and losing half a kilogram a week. */
async function cutting({
  sex = 'male',
  percent = 20,
  eatingDisorderHistory = false,
  goalMode = 'fatLoss',
}: { sex?: BiologicalSex; percent?: number; eatingDisorderHistory?: boolean; goalMode?: GoalMode } = {}): Promise<void> {
  const daysAgo = 42;
  const setup = typicalSetup({
    sex,
    goalMode,
    onboardedOn: today.addDays(-daysAgo - 14),
    healthCheckConfirmedOn: today,
    screening: new ScreeningAnswers({ eatingDisorderHistory }),
  });
  await repos.setup.saveSetup(setup.copyWith({ bodyFatPercent: percent }));
  await repos.targets.saveTargets(targetsFrom(today.addDays(-daysAgo), { kcal: 2100, tdeeKcal: 2600 }));
  for (let i = 0; i <= daysAgo + 14; i++) await repos.weights.saveWeight(today.addDays(-i), 80 + (i * 0.5) / 7);
}

const goalSection = async () => (await screen.findByRole('heading', { name: /^Goal:/ })).closest('.mm-section') as HTMLElement;

/** Opens the goal body fat sheet from the Coach and types `percent` in it. */
async function typeGoal(percent: string): Promise<HTMLElement> {
  renderApp(repos, today);
  await openTab('Coach');
  await userEvent.click(within(await goalSection()).getByRole('button', { name: /^Goal body fat/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Goal body fat' });
  const field = within(sheet).getByRole('textbox', { name: /^Goal body fat/ });
  await userEvent.clear(field);
  await userEvent.type(field, percent);
  return sheet;
}

it('a woman’s goal of 14% is refused, with the reason, and nothing is stored', async () => {
  await cutting({ sex: 'female', percent: 30 });
  const sheet = await typeGoal('14');
  const refusal = '14% is under 16%, the lowest goal body fat the app plans toward for women.';
  // Not said while typing: only once the value is left, with Set goal held off meanwhile.
  expect(within(sheet).queryByText(refusal)).not.toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Set goal' })).toBeDisabled();
  await userEvent.tab();
  expect(within(sheet).getByRole('alert')).toHaveTextContent(refusal);
  expect(within(sheet).getByRole('button', { name: 'Set goal' })).toBeDisabled();
  expect(await first(repos.goalBodyFat.watchGoalBodyFat())).toBeUndefined();
});

it('a man’s goal of 9% is stored, with the warning that once reached it is held four weeks at most', async () => {
  await cutting();
  const sheet = await typeGoal('9');
  const warning = '9% is under 10%, low enough that it is hard to hold. Once it is reached the plan holds it 4 weeks at most, then recommends a lean gain.';
  // Said politely as it is typed, never as an alert.
  expect(within(sheet).getByText(warning).closest('[aria-live="polite"]')).not.toBeNull();
  expect(within(sheet).queryByRole('alert')).not.toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Set goal' }));
  await expect.poll(async () => (await first(repos.goalBodyFat.watchGoalBodyFat()))?.percent).toBe(9);
  expect((await first(repos.goalBodyFat.watchGoalBodyFat()))?.setOn).toBe(today);
  expect(await screen.findByText('Goal body fat set to 9%, held 4 weeks at most once reached.')).toBeInTheDocument();
  // The row stays short; the warning is a caution notice under the goal section.
  const section = await goalSection();
  expect(await within(section).findByText('9%, set Oct 5')).toBeInTheDocument();
  expect(within(section).getByText(warning).closest('.mm-notice-caution')).not.toBeNull();
});

it('a goal of 18% is kept across a restart, and the plan runs the cut to it', async () => {
  await cutting({ percent: 22 });
  const sheet = await typeGoal('18');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Set goal' }));
  await expect.poll(async () => (await first(repos.goalBodyFat.watchGoalBodyFat()))?.percent).toBe(18);
  cleanup();

  renderApp(repos, today);
  await openTab('Coach');
  const section = await goalSection();
  expect(await within(section).findByText(/^18%, set /)).toBeInTheDocument();
  expect(within(section).getByText('At your current pace, when the lower end of your body-fat range reaches 18%.')).toBeInTheDocument();
});

it('a goal cleared goes back to the plan’s own line', async () => {
  await cutting({ percent: 22 });
  await repos.goalBodyFat.saveGoalBodyFat({ percent: 18, setOn: today.addDays(-7) });
  renderApp(repos, today);
  await openTab('Coach');
  await userEvent.click(within(await goalSection()).getByRole('button', { name: /^Goal body fat/ }));
  const sheet = await screen.findByRole('dialog', { name: 'Goal body fat' });
  // The goal in force cannot be set again as it is.
  expect(within(sheet).getByRole('button', { name: 'Set goal' })).toBeDisabled();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Use the plan’s 15%' }));
  await expect.poll(async () => first(repos.goalBodyFat.watchGoalBodyFat())).toBeUndefined();
  expect(await screen.findByText('The plan’s own goal, 15%, is back.')).toBeInTheDocument();
  expect(await within(await goalSection()).findByText('None set: the plan uses 15%.')).toBeInTheDocument();
});

it('with an eating-disorder history no goal body fat is offered', async () => {
  await cutting({ eatingDisorderHistory: true });
  renderApp(repos, today);
  await openTab('Coach');
  const section = await goalSection();
  expect(within(section).getByText('This phase')).toBeInTheDocument();
  expect(within(section).queryByRole('button', { name: /^Goal body fat/ })).not.toBeInTheDocument();
});

it('a partial value raises no alert while it is typed', async () => {
  await cutting();
  // "1" on the way to "12" is under the hard floor, but nothing is said until the value is left.
  const sheet = await typeGoal('1');
  expect(within(sheet).queryByRole('alert')).not.toBeInTheDocument();
  await userEvent.type(within(sheet).getByRole('textbox', { name: /^Goal body fat/ }), '2');
  expect(within(sheet).queryByRole('alert')).not.toBeInTheDocument();
  expect(within(sheet).getByRole('button', { name: 'Set goal' })).toBeEnabled();
});

it.each(['leanGain', 'maintenance'] as const)('in %s no goal body fat is offered', async (goalMode) => {
  await cutting({ goalMode });
  renderApp(repos, today);
  await openTab('Coach');
  const section = await goalSection();
  expect(within(section).getByRole('button', { name: /^What to expect/ })).toBeInTheDocument();
  expect(within(section).queryByRole('button', { name: /^Goal body fat/ })).not.toBeInTheDocument();
});

it('in recomp the goal body fat is offered', async () => {
  await cutting({ goalMode: 'recomp' });
  renderApp(repos, today);
  await openTab('Coach');
  expect(await within(await goalSection()).findByRole('button', { name: /^Goal body fat/ })).toBeInTheDocument();
});
