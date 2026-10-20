import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Unavailable } from '../../src/domain/integration/Unavailable';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { InMemoryOnlineFoodSource } from '../../src/foodOnline/InMemoryOnlineFoodSource';
import { openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { onlineGtin, onlineSource } from '../support/onlineFixtures';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-58: an unknown barcode is looked up online only if the person allows
 * it; the question says what is sent; a product found passes the checks, is
 * offered, and is found again with no connection.
 */
const today = CalendarDate.of(2026, 10, 20);
const digits = '4006381333931';
let repos: InMemoryRepositories;
let source: InMemoryOnlineFoodSource;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  source = onlineSource();
});

async function scanUnknown() {
  renderApp(repos, today, { change: (services) => ({ ...services, onlineSources: [source] }) });
  await openTab('Food');
  const sheet = await openAddFood();
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', digits);
  await press(sheet, 'Look up');
  return sheet;
}

it('the first unknown barcode asks, saying only the barcode number is sent and to whom, before any request', async () => {
  const sheet = await scanUnknown();
  const ask = await within(sheet).findByRole('group', { name: 'Look this up online?' });
  expect(ask).toHaveTextContent('Only the barcode number is sent to Open Food Facts, nothing about you');
  expect(source.asked, 'nothing sent before an answer').toEqual([]);
  expect(within(ask).getByRole('button', { name: 'Just this once' })).toBeInTheDocument();
  expect(within(ask).getByRole('button', { name: 'Always' })).toBeInTheDocument();
  expect(within(ask).getByRole('button', { name: 'Never' })).toBeInTheDocument();
});

it('just this once looks it up, offers the product found with where it came from, and keeps the choice as ask', async () => {
  const sheet = await scanUnknown();
  await press(sheet, 'Just this once');
  await screen.findByRole('heading', { name: /Thai peanut noodle kit/ }, { timeout: 5000 });
  expect(source.asked).toEqual([onlineGtin]);
  expect(screen.getByText(/found online/)).toBeInTheDocument();
  expect(await first(repos.preferences.watchOnlineLookup())).toBe('ask');
});

it('always is kept, and the next unknown code is looked up without asking', async () => {
  const sheet = await scanUnknown();
  await press(sheet, 'Always');
  await screen.findByRole('heading', { name: /Thai peanut noodle kit/ }, { timeout: 5000 });
  expect(await first(repos.preferences.watchOnlineLookup())).toBe('always');
});

it('never makes no request and offers the label instead', async () => {
  const sheet = await scanUnknown();
  await press(sheet, 'Never');
  await waitFor(() => expect(within(sheet).getByRole('status')).toHaveTextContent(/not in the food database on this phone/));
  expect(within(sheet).getByRole('button', { name: 'Read the label' })).toBeInTheDocument();
  expect(source.asked).toEqual([]);
  expect(await first(repos.preferences.watchOnlineLookup())).toBe('never');
  // And the next unknown code is not asked about again.
  await press(sheet, 'Back to search');
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', digits);
  await press(sheet, 'Look up');
  await waitFor(() => expect(within(sheet).getByRole('status')).toHaveTextContent(/not in the food database on this phone/));
  expect(within(sheet).queryByRole('group', { name: 'Look this up online?' })).toBeNull();
  expect(source.asked).toEqual([]);
});

it('a product found online is found again with no connection', async () => {
  await repos.preferences.saveOnlineLookup('always');
  const sheet = await scanUnknown();
  await screen.findByRole('heading', { name: /Thai peanut noodle kit/ }, { timeout: 5000 });
  // Cancel the amount step and scan again, offline.
  source.failWith(new Unavailable('No connection.'));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Back to search' }));
  await press(sheet, 'Scan');
  await typeIn(sheet, 'Or type the digits', digits);
  await press(sheet, 'Look up');
  await screen.findByRole('heading', { name: /Thai peanut noodle kit/ }, { timeout: 5000 });
  expect(source.asked, 'the second scan needed no request').toEqual([onlineGtin]);
});

it('a code no service knows, and a service that cannot be reached, each say so and offer the label', async () => {
  await repos.preferences.saveOnlineLookup('always');
  source.entries.length = 0;
  const sheet = await scanUnknown();
  await waitFor(() => expect(within(sheet).getByRole('status')).toHaveTextContent(/not in the food database on this phone or online/));
  expect(within(sheet).getByRole('button', { name: 'Read the label' })).toBeInTheDocument();
  source.failWith(new Unavailable('No connection.'));
  await press(sheet, 'Look up');
  await waitFor(() => expect(within(sheet).getByRole('status')).toHaveTextContent(/could not be reached/));
  expect(within(sheet).getByRole('button', { name: 'Read the label' })).toBeInTheDocument();
});
