import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../src/domain/CalendarDate';
import { InMemoryRepositories } from '../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../src/fixtures/typicalSetup';
import type { SystemBars } from '../src/platform/SystemBars';

/** Settings' sections start closed (MM-398): opens Appearance, once, to reach its row. */
async function openAppearance(): Promise<void> {
  const header = await screen.findByRole('button', { name: /^Appearance/ });
  if (header.getAttribute('aria-expanded') === 'false') await userEvent.click(header);
}
import { chooseFromMenu } from './support/openSettings';
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

const bar = () => screen.findByRole('button', { name: 'Menu' });
const drawer = async () => {
  await userEvent.click(await bar());
  return screen.findByRole('dialog', { name: 'Menu' });
};

describe('the four destinations', () => {
  it('are in the drawer, Dashboard first and current, and there is no bar below the screen (MM-711)', async () => {
    renderApp(repos, today);
    // The Dashboard is named Dashboard, as the drawer names it (MM-254).
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
    expect(screen.queryByRole('navigation')).toBeNull();
    const places = within(within(await drawer()).getByRole('group', { name: 'Destinations' })).getAllByRole('button');
    expect(places.map((place) => place.textContent)).toEqual(['Dashboard', 'Food', 'Train', 'Coach']);
    expect(places[0]).toHaveAttribute('aria-current', 'page');
  });

  it('show the chosen one and mark it current in words', async () => {
    renderApp(repos, today);
    await userEvent.click(within(await drawer()).getByRole('button', { name: 'Coach' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Coach');
    const again = await drawer();
    expect(within(again).getByRole('button', { name: 'Coach' })).toHaveAttribute('aria-current', 'page');
    expect(within(again).getByRole('button', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
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
    await chooseFromMenu('Settings');
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    // The look is a row that opens the chooser (MM-259); the value in force is marked.
    await openAppearance();
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
    await chooseFromMenu('Settings');
    const choose = async (name: string) => {
      await openAppearance();
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

    await chooseFromMenu('Settings');
    await openAppearance();
    await userEvent.click(screen.getByRole('button', { name: 'Change appearance' }));
    await userEvent.click(within(await screen.findByRole('dialog', { name: 'Appearance' })).getByRole('option', { name: 'Light' }));
    await screen.findByText('Light', { selector: '.mm-list-row-subtitle' });
    expect(told.at(-1)).toBe(false);
  });
});
