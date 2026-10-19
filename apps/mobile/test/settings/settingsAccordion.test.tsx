import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Profile } from '../../src/domain/Profile';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openSettings } from '../support/openSettings';
import { renderApp } from '../support/renderApp';
import { topLayer } from '../support/topLayer';

/** MM-398: Settings as an accordion, every section closed until opened. */
const today = CalendarDate.of(2026, 10, 18);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

const header = (name: string) => within(topLayer()).getByRole('button', { name: new RegExp(`^${name}`) });

it('opens with every section closed: each header shows and none of their rows', async () => {
  renderApp(repos, today);
  const settings = await openSettings({ closed: true });
  for (const name of ['Today’s setup', 'Nutrition goals', 'You', 'Reminders', 'Data', 'Appearance', 'About', 'Erase']) {
    expect(settings.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    expect(header(name)).toHaveAttribute('aria-expanded', 'false');
  }
  // Kept, so a half-typed amount survives folding, and hidden.
  expect(settings.getByText('Net carbs')).not.toBeVisible();
  expect(settings.getByText('Erase all data and start over')).not.toBeVisible();
});

it('a header opens its rows in place and closes them again, and two can be open at once', async () => {
  renderApp(repos, today);
  const settings = await openSettings({ closed: true });
  await userEvent.click(header('Today’s setup'));
  expect(header('Today’s setup')).toHaveAttribute('aria-expanded', 'true');
  expect(settings.getByText('Net carbs')).toBeVisible();
  await userEvent.click(header('Erase'));
  expect(settings.getByText('Erase all data and start over')).toBeVisible();
  expect(settings.getByText('Net carbs')).toBeVisible();
  await userEvent.click(header('Today’s setup'));
  expect(header('Today’s setup')).toHaveAttribute('aria-expanded', 'false');
});

it('correcting the date of birth from the adults-only screen opens Settings at "You"', async () => {
  const setup = typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today });
  await repos.setup.saveSetup(setup.copyWith({ profile: new Profile({ sex: 'male', birthDate: CalendarDate.of(today.year - 16, 1, 1), heightCm: 175 }) }));
  renderApp(repos, today);
  await userEvent.click(await screen.findByRole('button', { name: 'Correct date of birth' }));
  await within(topLayer()).findByRole('heading', { level: 1, name: 'Settings' });
  expect(header('You')).toHaveAttribute('aria-expanded', 'true');
  expect(header('Today’s setup')).toHaveAttribute('aria-expanded', 'false');
});
