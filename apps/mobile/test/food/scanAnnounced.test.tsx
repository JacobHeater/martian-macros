import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { openAddFood, press, typeIn } from '../support/addFood';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-351: what a barcode lookup found is announced politely, without moving
 * focus, from a status region that exists before its text (the panel's F1:
 * a region inserted together with its text is not reliably announced).
 */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

it('an unknown code looked up is announced as a status', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  const status = within(sheet).getByRole('status');
  expect(status).toHaveTextContent('');
  await typeIn(sheet, 'Or type the digits', '4006381333931');
  await press(sheet, 'Look up');
  await waitFor(() => expect(status).toHaveTextContent(/not in the food database on this phone/));
  // Focus stays where the person was: on the sheet, not thrown to the notice.
  expect(status.contains(document.activeElement)).toBe(false);
  expect(screen.getByRole('dialog', { name: 'Add food' })).toBeInTheDocument();
});

it.skip('MM-413: a camera that cannot be used is announced and keeps focus on the sheet', async () => {
  // The scan button is replaced by a notice that is not announced, and focus falls to the body (the panel's F2 on MM-351).
});
