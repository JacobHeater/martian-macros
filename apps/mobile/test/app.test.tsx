import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../src/domain/CalendarDate';
import { InMemoryRepositories } from '../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../src/fixtures/typicalSetup';
import type { SystemBars } from '../src/platform/SystemBars';
import { renderApp } from './support/renderApp';

/** MM-229, MM-232: the shell of the app, for someone who is set up. */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const bar = () => screen.findByRole('navigation', { name: 'Destinations' });

describe('the five destinations', () => {
  it('are in a bottom bar, Dashboard first and current', async () => {
    renderApp(repos, today);
    const places = within(await bar()).getAllByRole('button');
    expect(places.map((place) => place.textContent)).toEqual(['Dashboard', 'Food', 'Train', 'Progress', 'Coach']);
    expect(places[0]).toHaveAttribute('aria-current', 'page');
    // The Dashboard is named Dashboard, as the bar names it (MM-254).
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
  });

  it('show the chosen one and mark it current in words', async () => {
    renderApp(repos, today);
    const destinations = await bar();
    await userEvent.click(within(destinations).getByRole('button', { name: 'Progress' }));
    expect(within(destinations).getByRole('button', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
    expect(within(destinations).getByRole('button', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Progress');
  });
});

describe('the theme', () => {
  it('is the one that was chosen', async () => {
    renderApp(repos, today);
    await bar();
    expect(document.documentElement).toHaveClass('theme-martian');
  });

  it('changes at once when another is chosen in Settings, and is kept', async () => {
    renderApp(repos, today);
    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    // The look is a row that opens the chooser (MM-259); the value in force is marked.
    await userEvent.click(screen.getByRole('button', { name: 'Change appearance' }));
    const dialog = await screen.findByRole('dialog', { name: 'Appearance' });
    const choices = within(dialog).getAllByRole('option');
    expect(choices.map((choice) => choice.textContent?.replace('Chosen', ''))).toEqual(['Martian', 'Light', 'Dark', 'System']);

    await userEvent.click(within(dialog).getByRole('option', { name: 'Light' }));
    await screen.findByText('Light', { selector: '.mm-list-row-subtitle' });
    expect(document.documentElement).toHaveClass('theme-light');

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await bar()).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument();
  });

  // From martian_theme_startup_test.dart: "Settings ... reports failed saves".
  it('says so when a choice cannot be saved, and keeps the one in force', async () => {
    await repos.preferences.saveThemePreference('light');
    let fail = true;
    renderApp(repos, today, {
      change: (services) => ({
        ...services,
        preferences: Object.assign(Object.create(services.preferences) as typeof services.preferences, {
          saveThemePreference: async (preference: Parameters<typeof services.preferences.saveThemePreference>[0]) => {
            if (fail) throw new Error('theme write unavailable');
            await services.preferences.saveThemePreference(preference);
          },
        }),
      }),
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    const choose = async (name: string) => {
      await userEvent.click(screen.getByRole('button', { name: 'Change appearance' }));
      await userEvent.click(within(await screen.findByRole('dialog', { name: 'Appearance' })).getByRole('option', { name }));
    };
    await choose('Martian');
    expect(await screen.findByText('Your appearance could not be saved. Nothing was changed.')).toBeInTheDocument();
    expect(document.documentElement).toHaveClass('theme-light');

    fail = false;
    await choose('Martian');
    await screen.findByText('Martian', { selector: '.mm-list-row-subtitle' });
    expect(document.documentElement).toHaveClass('theme-martian');
  });

  it('follows the phone when System is chosen', async () => {
    await repos.preferences.saveThemePreference('system');
    renderApp(repos, today);
    await bar();
    // The test phone is set to a light appearance (test/setup.ts).
    expect(document.documentElement).toHaveClass('theme-light');
  });
});

describe("the phone's bars", () => {
  it('are told the background is dark in Martian and light in Light', async () => {
    const told: boolean[] = [];
    const bars: SystemBars = { setBackgroundIsDark: (dark) => told.push(dark) };
    renderApp(repos, today, { systemBars: bars });
    await bar();
    expect(told.at(-1)).toBe(true);

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await userEvent.click(screen.getByRole('button', { name: 'Change appearance' }));
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Appearance' })).getByRole('option', { name: 'Light' }));
    await screen.findByText('Light', { selector: '.mm-list-row-subtitle' });
    expect(told.at(-1)).toBe(false);
  });
});
