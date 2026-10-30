import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Profile } from '../../src/domain/Profile';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openProfile, openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/**
 * MM-705: who the person is and what they aim for are on Profile, a screen
 * of their own from the drawer: "You" and "Nutrition goals", both closed on
 * arrival. Settings no longer shows them, and a way in about one of their
 * rows lands on Profile.
 */
const today = CalendarDate.of(2026, 10, 30);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const header = (name: string) => within(topLayer()).getByRole('button', { name: new RegExp(`^${name}`) });

it('Profile from the drawer shows You and Nutrition goals, both closed until pressed (MM-712)', async () => {
  renderApp(repos, today);
  const profile = await openProfile({ closed: true });
  expect(profile.getByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
  // Every fold starts closed (the owner, MM-712): nothing of either section is in sight.
  expect(header('You')).toHaveAttribute('aria-expanded', 'false');
  expect(header('Nutrition goals')).toHaveAttribute('aria-expanded', 'false');
  expect(profile.queryByText('Biological sex')).not.toBeVisible();
  expect(profile.queryByText('Daily water goal')).not.toBeVisible();
  // Each opens in place.
  await userEvent.click(header('You'));
  expect(header('You')).toHaveAttribute('aria-expanded', 'true');
  expect(profile.getByText('Biological sex')).toBeVisible();
  expect(header('Nutrition goals')).toHaveAttribute('aria-expanded', 'false');
  // Nothing of Settings' other sections is here.
  expect(profile.queryByRole('heading', { level: 2, name: 'Today’s setup' })).toBeNull();
  expect(profile.queryByRole('heading', { level: 2, name: 'Appearance' })).toBeNull();
});

it('Settings no longer shows You or Nutrition goals, and keeps the rest in order', async () => {
  renderApp(repos, today);
  const settings = await openSettings({ closed: true });
  await settings.findByRole('heading', { level: 2, name: 'Health Connect' });
  const sections = settings.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
  expect(sections).not.toContain('You');
  expect(sections).not.toContain('Nutrition goals');
  expect(sections[0]).toBe('Today’s setup');
  expect(sections.at(-1)).toBe('Erase');
});

it('correcting the date of birth from the adults-only screen opens Profile with You open', async () => {
  const setup = typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today });
  await repos.setup.saveSetup(setup.copyWith({ profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(today.year - 16, 1, 1), heightCm: 175 }) }));
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Correct date of birth' }));
  await within(topLayer()).findByRole('heading', { level: 1, name: 'Profile' });
  expect(header('You')).toHaveAttribute('aria-expanded', 'true');
  expect(screen.queryByRole('heading', { level: 1, name: 'Settings' })).toBeNull();
});
