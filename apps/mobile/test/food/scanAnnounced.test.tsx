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

it('MM-413: a camera that cannot be used is announced from the status region, and focus moves to the digits', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  const status = within(sheet).getByRole('status');
  expect(status).toHaveTextContent('');
  await press(sheet, 'Scan with the camera');
  await waitFor(() => expect(status).toHaveTextContent(/The camera is not available/));
  // The button stays, off; the next useful control has the focus; the sheet is still open.
  const button = within(sheet).getByRole('button', { name: 'Scan with the camera' });
  expect(button).toBeDisabled();
  expect(document.activeElement).toBe(within(sheet).getByRole('textbox', { name: 'Or type the digits' }));
  expect(screen.getByRole('dialog', { name: 'Add food' })).toBeInTheDocument();
});
