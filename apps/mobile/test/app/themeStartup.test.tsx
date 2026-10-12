import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { ThemePreference } from '../../src/domain/ThemePreference';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import type { Watched } from '../../src/lang/Watched';
import type { AppServices } from '../../src/state/AppServices';
import { first } from '../support/first';
import { renderApp } from '../support/renderApp';

/** Carried over from martian_theme_startup_test.dart (MM-184, MM-185, MM-186). */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;
beforeEach(() => {
  repos = new InMemoryRepositories();
});

const palette = () => document.documentElement.className;
const stored = () => first(repos.preferences.watchThemePreference());
const continueOn = () => userEvent.click(screen.getByRole('button', { name: 'Continue' }));

/** The preferences, with the theme read from `watch` and saved through `save`. */
function withTheme(
  services: AppServices,
  { watch, save }: { watch?: () => Watched<ThemePreference>; save?: (preference: ThemePreference) => Promise<void> },
): AppServices {
  const preferences = Object.create(services.preferences) as AppServices['preferences'];
  if (watch !== undefined) preferences.watchThemePreference = watch;
  if (save !== undefined) preferences.saveThemePreference = save;
  return { ...services, preferences };
}

/** A theme store a test feeds by hand. */
function handFed() {
  let tell: ((preference: ThemePreference) => void) | undefined;
  let fail: ((error: unknown) => void) | undefined;
  const watched: Watched<ThemePreference> = {
    subscribe: (listener, onError) => {
      tell = listener;
      fail = onError;
      return () => undefined;
    },
  };
  return { watched, tell: (p: ThemePreference) => tell?.(p), fail: (e: unknown) => fail?.(e) };
}

it('fresh install starts in Martian, accepts it and never asks again', async () => {
  const view = renderApp(repos, today);
  expect(await screen.findByRole('heading', { name: 'Choose your theme' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Get started' })).not.toBeInTheDocument();
  expect(palette()).toBe('theme-martian');
  const choices = [...document.querySelectorAll('.mm-choice-card-label')].map((label) => label.firstChild?.textContent);
  expect(choices).toEqual(['Martian', 'Light', 'Dark', 'System']);
  expect(screen.getByRole('button', { pressed: true })).toHaveTextContent(/^Martian/);

  await continueOn();
  expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
  expect(await stored()).toBe('martian');
  expect(palette()).toBe('theme-martian');

  view.unmount();
  renderApp(repos, today);
  expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Choose your theme' })).not.toBeInTheDocument();
  expect(palette()).toBe('theme-martian');
});

it('choices preview immediately but are not saved before Continue', async () => {
  const view = renderApp(repos, today);
  await screen.findByRole('heading', { name: 'Choose your theme' });
  for (const [label, expected] of [
    ['Light', 'theme-light'],
    ['Dark', 'theme-dark'],
    ['System', 'theme-light'],
    ['Martian', 'theme-martian'],
  ] as const) {
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));
    expect(palette(), label).toBe(expected);
    expect(await stored(), label).toBe('unselected');
  }

  // A look that was only tried is forgotten when the app is opened again.
  await userEvent.click(screen.getByRole('button', { name: /^Dark/ }));
  view.unmount();
  renderApp(repos, today);
  await screen.findByRole('heading', { name: 'Choose your theme' });
  expect(palette()).toBe('theme-martian');

  await userEvent.click(screen.getByRole('button', { name: /^Light/ }));
  await continueOn();
  await screen.findByRole('button', { name: 'Get started' });
  expect(palette()).toBe('theme-light');
  expect(await stored()).toBe('light');
});

describe.each([
  ['system', 'theme-light'],
  ['light', 'theme-light'],
  ['dark', 'theme-dark'],
] as const)('an installation that already chose %s', (preference, expected) => {
  it('skips the chooser even without setup', async () => {
    await repos.preferences.saveThemePreference(preference);
    renderApp(repos, today);
    expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Choose your theme' })).not.toBeInTheDocument();
    expect(palette()).toBe(expected);
  });
});

describe.each([
  ['dark', 'theme-dark'],
  ['system', 'theme-light'],
] as const)('MM-186: while an existing %s preference is being read', (preference, expected) => {
  it('the app follows the phone and does not show Martian first', async () => {
    const theme = handFed();
    renderApp(repos, today, { change: (services) => withTheme(services, { watch: () => theme.watched }) });
    await screen.findByRole('progressbar');
    expect(palette()).toBe('theme-light');
    expect(screen.queryByRole('heading', { name: 'Choose your theme' })).not.toBeInTheDocument();

    theme.tell(preference);
    expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
    expect(palette()).toBe(expected);
  });
});

it('theme loading blocks onboarding and a load failure offers retry', async () => {
  const theme = handFed();
  let failed = false;
  renderApp(repos, today, {
    change: (services) =>
      withTheme(services, {
        watch: () =>
          failed
            ? {
                subscribe: (listener) => {
                  listener('system');
                  return () => undefined;
                },
              }
            : theme.watched,
      }),
  });
  expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Get started' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Choose your theme' })).not.toBeInTheDocument();

  theme.fail(new Error('theme read unavailable'));
  expect(await screen.findByText('Could not load your theme preference.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Get started' })).not.toBeInTheDocument();

  failed = true;
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
});

it('failed Continue keeps preview and selection, retry persists them', async () => {
  let fail = true;
  let calls = 0;
  renderApp(repos, today, {
    change: (services) =>
      withTheme(services, {
        save: async (preference) => {
          calls++;
          if (fail) throw new Error('theme write unavailable');
          await repos.preferences.saveThemePreference(preference);
        },
      }),
  });
  await screen.findByRole('heading', { name: 'Choose your theme' });
  await userEvent.click(screen.getByRole('button', { name: /^Dark/ }));
  await continueOn();
  expect(await screen.findByText('Could not save your theme. Please try again.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Get started' })).not.toBeInTheDocument();
  expect(palette()).toBe('theme-dark');
  expect(await stored()).toBe('unselected');

  fail = false;
  await continueOn();
  expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
  expect(calls).toBe(2);
  expect(await stored()).toBe('dark');
});

it('MM-185: preview stays selected until storage emits the saved choice', async () => {
  const theme = handFed();
  renderApp(repos, today, {
    change: (services) => withTheme(services, { watch: () => theme.watched, save: async () => undefined }),
  });
  theme.tell('unselected');
  await screen.findByRole('heading', { name: 'Choose your theme' });
  await userEvent.click(screen.getByRole('button', { name: /^Light/ }));
  await continueOn();
  // Saved, but the store has not said so yet: still the chooser, in the look chosen.
  expect(screen.getByRole('heading', { name: 'Choose your theme' })).toBeInTheDocument();
  expect(palette()).toBe('theme-light');
  expect(within(screen.getByRole('button', { pressed: true })).getByText('Light')).toBeInTheDocument();

  theme.tell('light');
  expect(await screen.findByRole('button', { name: 'Get started' })).toBeInTheDocument();
  expect(palette()).toBe('theme-light');
});
