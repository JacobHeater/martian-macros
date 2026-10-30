import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openProfile } from '../support/openSettings';
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
  const settings = await openProfile();
  expect(await settings.findByRole('switch', { name: /^Daily water goal/ })).toBeChecked();
  expect(settings.getByText(/^Suggested from your protein target and training./)).toBeInTheDocument();
  expect(settings.getByRole('textbox', { name: /^Daily water goal, / })).not.toHaveValue('');
});

it('an amount typed is their own, and "Use suggested" returns to the suggestion', async () => {
  await setUp();
  await repos.preferences.saveWaterGoal(3500);
  renderApp(repos, today);
  const settings = await openProfile();
  // An amount the person typed needs no note: the hint is the range alone (MM-401).
  expect(await settings.findByText(/^17 to 202 fl oz.$/)).toBeInTheDocument();
  await userEvent.click(settings.getByRole('button', { name: /^Use the suggested amount/ }));
  expect(await settings.findByText(/^Suggested from your protein target and training./)).toBeInTheDocument();
  expect((await first(repos.preferences.watchNutritionGoals())).waterGoalMl).toBeUndefined();
  // The row goes once pressed; focus is on the field, now holding the suggestion (the panel's UX-3).
  await expect.poll(() => document.activeElement?.getAttribute('aria-label')).toBe('Daily water goal, fluid ounces');
});

it('switched off, it stays off', async () => {
  await setUp();
  renderApp(repos, today);
  const settings = await openProfile();
  await userEvent.click(await settings.findByRole('switch', { name: /^Daily water goal/ }));
  expect((await first(repos.preferences.watchNutritionGoals())).waterGoalOff).toBe(true);
  expect(settings.queryByText(/^Suggested from your/)).not.toBeInTheDocument();
});

it('where a clinician limits what is drunk, nothing is suggested and the reason is said', async () => {
  await setUp(new ScreeningAnswers({ fluidLimitedByClinician: true }));
  renderApp(repos, today);
  const settings = await openProfile();
  const toggle = await settings.findByRole('switch', { name: /^Daily water goal/ });
  expect(toggle).not.toBeChecked();
  expect(settings.getByText('Your clinician limits your fluids.')).toBeInTheDocument();
  await userEvent.click(toggle);
  // A limit is never asked for as a goal to fill, and what it counts is said (the panel's safety S-1).
  expect(await settings.findByText(/^Only if your clinician gave you an amount of water to drink. This counts plain water only, not other drinks or food./)).toBeInTheDocument();
  expect(settings.queryByRole('button', { name: /^Use the suggested amount/ })).not.toBeInTheDocument();
});

it('MM-359: the health check asks whether a clinician limits what the person drinks, and keeps the answer', async () => {
  await setUp();
  const setup = await first(repos.setup.watchSetup());
  await repos.setup.saveSetup(setup!.copyWith({ screening: new ScreeningAnswers({ fluidLimitedByClinician: true }) }));
  expect((await first(repos.setup.watchSetup()))?.screening.fluidLimitedByClinician).toBe(true);
  const { HealthStep } = await import('../../src/onboarding/HealthStep');
  const { render } = await import('@testing-library/react');
  render(<HealthStep screening={new ScreeningAnswers()} female={false} onChange={() => undefined} />);
  expect(within(document.body).getByText('A clinician has told me to limit my fluids')).toBeInTheDocument();
  expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
});

it('MM-359: a clinician’s fluid limit counts among the health check answers ticked', async () => {
  await setUp(new ScreeningAnswers({ fluidLimitedByClinician: true }));
  renderApp(repos, today);
  const settings = await openProfile();
  expect(await settings.findByText('1 answer ticked')).toBeInTheDocument();
});

it('with an eating-disorder history, a goal above 3.5 L is said to be more than most people need', async () => {
  await setUp(new ScreeningAnswers({ eatingDisorderHistory: true }));
  await repos.preferences.saveWaterGoal(3800);
  renderApp(repos, today);
  const settings = await openProfile();
  expect(await settings.findByText(/More than most people need; spread it through the day\./)).toBeInTheDocument();
});
