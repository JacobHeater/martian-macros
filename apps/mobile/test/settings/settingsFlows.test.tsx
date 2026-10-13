import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { first } from '../support/first';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-93: Settings flows (MM-62, MM-81, MM-82), with the Settings cases of
 * MM-164 and MM-165. Carried over from settings_flows_test.dart and
 * activity_and_theme_test.dart.
 */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function open(theme: 'martian' | 'system' | 'dark' | 'light' = 'martian') {
  await repos.preferences.saveThemePreference(theme);
  renderApp(repos, today);
  return openSettings();
}

const setup = async () => {
  const stored = await repos.setup.loadSetup();
  if (stored === undefined) throw new Error('No setup is stored.');
  return stored;
};

async function chooseFromMenu(button: string, item: string): Promise<void> {
  await userEvent.click(within(topLayer()).getByRole('button', { name: button }));
  await userEvent.click(await screen.findByRole('menuitem', { name: item }));
}

it('switching units saves the choice', async () => {
  const settings = await open();
  expect((await setup()).unitSystem).toBe('imperial');
  await userEvent.click(settings.getByRole('button', { name: 'kg / cm' }));
  await expect.poll(async () => (await setup()).unitSystem).toBe('metric');
});

it('experience can be changed', async () => {
  await open();
  await chooseFromMenu('Change experience', '3+ years');
  await expect.poll(async () => (await setup()).trainingStatus).toBe('advanced');
});

it('daily activity can be changed (MM-164)', async () => {
  const settings = await open();
  expect(settings.getByText('Light movement')).toBeInTheDocument();
  await chooseFromMenu('Change daily activity', 'Physical job');
  await expect.poll(async () => (await setup()).dailyActivity).toBe('physicalJob');
  expect(await settings.findByText('Physical job')).toBeInTheDocument();
});

it('training days can be changed with the slider', async () => {
  const settings = await open();
  expect((await setup()).trainingDaysPerWeek).toBe(3);
  fireEvent.change(settings.getByRole('slider', { name: 'Training days per week' }), { target: { value: '5' } });
  await expect.poll(async () => (await setup()).trainingDaysPerWeek).toBe(5);
  expect(await settings.findByText('Training days per week: 5')).toBeInTheDocument();
});

it('body fat can be entered and removed', async () => {
  const settings = await open();
  expect((await setup()).bodyFatPercent).toBeUndefined();
  await userEvent.click(settings.getByRole('switch', { name: /Let the app estimate/ }));
  await expect.poll(async () => (await setup()).bodyFatPercent).toBe(25);
  await userEvent.click(await settings.findByRole('switch', { name: /About 25%/ }));
  await expect.poll(async () => (await setup()).bodyFatPercent).toBeUndefined();
});

// MM-240: the body fat slider was put into its group bare, and ran edge to edge.
it('every slider sits in a list row, at the row’s inset', async () => {
  const settings = await open();
  await userEvent.click(settings.getByRole('switch', { name: /Let the app estimate/ }));
  await settings.findByRole('slider', { name: 'Body fat percent' });
  const sliders = settings.getAllByRole('slider');
  expect(sliders).toHaveLength(2);
  for (const slider of sliders) expect(slider.closest('.mm-list-row')).not.toBeNull();
});

it('the detail of nutrition shown can be changed, and says what each shows', async () => {
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: 'Full' }));
  await expect.poll(() => first(repos.preferences.watchDetailLevel())).toBe('full');
  expect(settings.getByText(/Changes what is shown, never what is stored\./)).toBeInTheDocument();
});

it('the easy-to-miss line can be turned off', async () => {
  const settings = await open();
  await userEvent.click(settings.getByRole('switch', { name: /Easy-to-miss reminder/ }));
  await expect.poll(async () => (await first(repos.preferences.watchEasyToMiss())).enabled).toBe(false);
});

it('erasing asks first; cancel keeps everything', async () => {
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: 'Erase all data and start over' }));
  const question = await screen.findByRole('dialog', { name: 'Erase everything?' });
  await userEvent.click(within(question).getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog', { name: 'Erase everything?' })).not.toBeInTheDocument();
  expect(await repos.setup.loadSetup()).toBeDefined();
});

it('confirming erases everything and returns to initial setup', async () => {
  const settings = await open();
  await userEvent.click(settings.getByRole('button', { name: 'Erase all data and start over' }));
  const question = await screen.findByRole('dialog', { name: 'Erase everything?' });
  await userEvent.click(within(question).getByRole('button', { name: 'Erase' }));
  // First use again: the terms (MM-242), then the theme, then onboarding.
  await userEvent.click(await screen.findByRole('button', { name: 'I agree' }));
  expect(await screen.findByRole('heading', { name: 'Choose your theme' })).toBeInTheDocument();
  expect(await repos.setup.loadSetup()).toBeUndefined();
  expect(await first(repos.weights.watchWeights())).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
});

it('the build is named, and the gallery is gone to Storybook (MM-237)', async () => {
  const settings = await open();
  expect(settings.getByText('Martian Macros · dev')).toBeInTheDocument();
  expect(settings.queryByRole('button', { name: /gallery/i })).not.toBeInTheDocument();
});

describe('theme preference (MM-165)', () => {
  const palette = () => document.documentElement.className;

  it('Dark and Light apply at once and are stored', async () => {
    const settings = await open();
    await userEvent.click(settings.getByRole('button', { name: 'Dark' }));
    await expect.poll(palette).toBe('theme-dark');
    expect(await first(repos.preferences.watchThemePreference())).toBe('dark');
    await userEvent.click(settings.getByRole('button', { name: 'Light' }));
    await expect.poll(palette).toBe('theme-light');
    await userEvent.click(settings.getByRole('button', { name: 'System' }));
    await expect.poll(() => first(repos.preferences.watchThemePreference())).toBe('system');
  });

  it('a stored choice is applied when the app opens', async () => {
    await open('dark');
    expect(palette()).toBe('theme-dark');
  });
});

/** MM-164, from activity_and_theme_test.dart. */
it('the Coach screen names every input of the starting estimate', async () => {
  await repos.preferences.saveThemePreference('martian');
  renderApp(repos, today);
  await openTab('Coach');
  await userEvent.click(await screen.findByRole('button', { name: /Your metabolism estimate/ }));
  expect(
    await screen.findByText(/sex, age, height, weight, daily activity and training days/),
  ).toBeInTheDocument();
});
