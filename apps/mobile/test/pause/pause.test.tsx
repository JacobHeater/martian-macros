import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Pause } from '../../src/domain/Pause';
import type { PauseReason } from '../../src/domain/PauseReason';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-148: pausing for a holiday, an illness or an injury. Carried over from pause_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

async function seed(lastWeighInDaysAgo = 0): Promise<void> {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-200), healthCheckConfirmedOn: today.addDays(-30) }),
  );
  await repos.weights.saveWeight(today.addDays(-lastWeighInDaysAgo), 82);
}

const pause = (from: number, to: number, reason: PauseReason = 'travel') =>
  new Pause({ from: today.addDays(from), to: today.addDays(to), reason });

const eat = (kcal: number) =>
  repos.food.addFood(foodOn(today, { name: 'Wedding dinner', kcal, proteinG: 120, carbsG: 380, fatG: 140 }));

const shell = () => screen.findByRole('navigation', { name: 'Destinations' });

async function openPause(): Promise<void> {
  renderApp(repos, today);
  await shell();
  // Settings' sections start closed (MM-398); the helper opens them.
  const settings = await openSettings();
  await userEvent.click(settings.getByRole('button', { name: /^Pause/ }));
  await within(topLayer()).findByRole('heading', { name: 'Pause' });
}

const pauses = () => first(repos.pauses.watchPauses());
const shown = () => (document.body.textContent ?? '').toLowerCase();

it('a paused day is never called over', async () => {
  await seed();
  await repos.pauses.savePause(pause(-2, 5));
  await eat(3400);
  renderApp(repos, today);
  expect(await screen.findByText(/paused, guide/)).toBeInTheDocument();
  expect(screen.getByText(/Paused until/)).toBeInTheDocument();
  // "Recovery" and "discovery" are not the word.
  expect(shown()).not.toMatch(/\bover\b/);
  expect(screen.getByText('3,400')).toBeInTheDocument();
});

it('the same day without a pause is over', async () => {
  await seed();
  await eat(3400);
  renderApp(repos, today);
  expect(await screen.findByText(/kcal over/)).toBeInTheDocument();
});

it('a pause is set from Settings, starting today', async () => {
  await seed();
  await openPause();
  await userEvent.click(screen.getByRole('button', { name: 'Pause from today' }));
  expect(await screen.findByRole('button', { name: 'Resume now' })).toBeInTheDocument();
  const saved = await pauses();
  expect(saved).toHaveLength(1);
  expect(saved[0]?.from).toBe(today);
  expect(saved[0]?.days).toBe(7);
  expect(saved[0]?.reason).toBe('travel');
  expect(await first(repos.weightEvents.watchWeightEvents()), 'travel records no weight event').toEqual([]);
});

it('an illness pause records a weight event for its days', async () => {
  await seed();
  await openPause();
  await userEvent.click(screen.getByRole('button', { name: 'Illness' }));
  await userEvent.click(screen.getByRole('button', { name: 'Pause from today' }));
  await screen.findByRole('button', { name: 'Resume now' });
  const events = await first(repos.weightEvents.watchWeightEvents());
  expect(events).toHaveLength(1);
  expect(events[0]?.date).toBe(today);
  expect(events[0]?.type).toBe('illness');
});

it('a pause can be extended once', async () => {
  await seed();
  await repos.pauses.savePause(pause(-2, 5));
  await openPause();
  const extend = screen.getByRole('button', { name: 'Extend by a week' });
  await userEvent.click(extend);
  await expect.poll(async () => (await pauses())[0]?.extended).toBe(true);
  expect((await pauses())[0]?.to).toBe(today.addDays(12));
  expect(await screen.findByText(/A pause can be extended once\./)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Extend by a week' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Extend by a week' }));
  expect((await pauses())[0]?.to).toBe(today.addDays(12));
});

it('resuming early asks for a weigh-in and nothing else', async () => {
  await seed(4);
  await repos.pauses.savePause(pause(-3, 5));
  await openPause();
  await userEvent.click(screen.getByRole('button', { name: 'Resume now' }));
  expect(await screen.findByRole('heading', { name: 'Ready to resume?' })).toBeInTheDocument();
  expect((await pauses())[0]?.to).toBe(today.addDays(-1));
  expect(screen.queryByRole('navigation', { name: 'Destinations' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
});

it('the resume screen has no word for absence', async () => {
  await seed(12);
  await repos.pauses.savePause(pause(-11, -1));
  renderApp(repos, today);
  await screen.findByRole('heading', { name: 'Ready to resume?' });
  const all = shown();
  for (const word of ['back', 'away', 'missed', 'streak', 'gap', 'lost']) expect(all, word).not.toContain(word);
});

it('a weigh-in after a pause opens the dashboard', async () => {
  await seed(12);
  await repos.pauses.savePause(pause(-11, -1));
  renderApp(repos, today);
  await userEvent.type(await screen.findByRole('textbox', { name: 'Today’s weigh-in' }), '181');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Ready to resume?' })).not.toBeInTheDocument();
});

it('Later puts the resume screen away', async () => {
  await seed(12);
  await repos.pauses.savePause(pause(-11, -1));
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Later' }));
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Ready to resume?' })).not.toBeInTheDocument();
});

it('days with nothing recorded in a pause are not a lapse', async () => {
  await seed(12);
  await repos.pauses.savePause(pause(-11, 3));
  renderApp(repos, today);
  expect(await shell()).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Welcome back' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Ready to resume?' })).not.toBeInTheDocument();
});

it('the Coach screen says it is paused and offers the way out', async () => {
  await seed();
  await repos.pauses.savePause(pause(-2, 5));
  renderApp(repos, today);
  await openTab('Coach');
  expect(await screen.findByText('Paused until Oct 10')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Manage pause' }));
  expect(await within(topLayer()).findByRole('button', { name: 'Resume now' })).toBeInTheDocument();
});

const heavyUse = /That makes a lot of paused days lately\./;

it('many paused days prompt one neutral question', async () => {
  await seed();
  await repos.pauses.savePause(pause(-100, -73));
  await repos.pauses.savePause(pause(-60, -33));
  await repos.weights.saveWeight(today.addDays(-1), 82);
  await openPause();
  expect(screen.getByText(heavyUse)).toBeInTheDocument();
  // It is a question, not a refusal: the pause can still be set.
  await userEvent.click(screen.getByRole('button', { name: 'Pause from today' }));
  await expect.poll(async () => (await pauses()).length).toBe(3);
});

it('a first pause prompts nothing', async () => {
  await seed();
  await openPause();
  expect(screen.queryByText(heavyUse)).not.toBeInTheDocument();
});
