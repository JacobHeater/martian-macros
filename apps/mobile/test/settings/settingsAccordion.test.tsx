import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
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
  // Health Connect is drawn once the platform has answered, so it is waited for (MM-407).
  await settings.findByRole('heading', { level: 2, name: 'Health Connect' });
  for (const name of ['Today’s setup', 'Reminders', 'Health Connect', 'Data', 'Appearance', 'About', 'Erase']) {
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
