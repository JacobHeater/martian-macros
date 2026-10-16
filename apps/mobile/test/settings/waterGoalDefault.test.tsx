import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';

/** MM-358, MM-359: the water goal in Settings, on by default and suggested for the person. */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
});

const setUp = async (screening = new ScreeningAnswers()) =>
  repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }).copyWith({ screening }));

it('with nothing set, the goal is on and its amount is suggested for the person', async () => {
  await setUp();
  renderApp(repos, today);
  const settings = await openSettings();
  expect(await settings.findByRole('switch', { name: /^Daily water goal/ })).toBeChecked();
  expect(settings.getByText('Suggested for you, from your protein target and training days.')).toBeInTheDocument();
  expect(settings.getByRole('textbox', { name: /^Daily water goal, / })).not.toHaveValue('');
});

it('an amount typed is their own, and "Use suggested" returns to the suggestion', async () => {
  await setUp();
  await repos.preferences.saveWaterGoal(3500);
  renderApp(repos, today);
  const settings = await openSettings();
  expect(await settings.findByText('Your own amount.')).toBeInTheDocument();
  await userEvent.click(settings.getByRole('button', { name: 'Use the suggested amount' }));
  expect(await settings.findByText('Suggested for you, from your protein target and training days.')).toBeInTheDocument();
  expect((await first(repos.preferences.watchNutritionGoals())).waterGoalMl).toBeUndefined();
});

it('switched off, it stays off', async () => {
  await setUp();
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('switch', { name: /^Daily water goal/ }));
  expect((await first(repos.preferences.watchNutritionGoals())).waterGoalOff).toBe(true);
  expect(settings.queryByText(/^Suggested for you/)).not.toBeInTheDocument();
});

it('where a clinician limits what is drunk, nothing is suggested and the reason is said', async () => {
  await setUp(new ScreeningAnswers({ fluidLimitedByClinician: true }));
  renderApp(repos, today);
  const settings = await openSettings();
  const toggle = await settings.findByRole('switch', { name: /^Daily water goal/ });
  expect(toggle).not.toBeChecked();
  expect(settings.getByText('Your clinician limits how much you drink.')).toBeInTheDocument();
  await userEvent.click(toggle);
  expect(await settings.findByText('Type the amount your care team gave you.')).toBeInTheDocument();
  expect(settings.queryByRole('button', { name: 'Use the suggested amount' })).not.toBeInTheDocument();
});

it('MM-359: the health check asks whether a clinician limits what the person drinks, and keeps the answer', async () => {
  await setUp();
  const setup = await first(repos.setup.watchSetup());
  await repos.setup.saveSetup(setup!.copyWith({ screening: new ScreeningAnswers({ fluidLimitedByClinician: true }) }));
  expect((await first(repos.setup.watchSetup()))?.screening.fluidLimitedByClinician).toBe(true);
  const { HealthStep } = await import('../../src/onboarding/HealthStep');
  const { render } = await import('@testing-library/react');
  render(<HealthStep screening={new ScreeningAnswers()} female={false} onChange={() => undefined} />);
  expect(within(document.body).getByText('A clinician has told me to limit how much I drink')).toBeInTheDocument();
  expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
});
