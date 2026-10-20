import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Unavailable } from '../../src/domain/integration/Unavailable';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { InMemoryOnlineFoodSource } from '../../src/foodOnline/InMemoryOnlineFoodSource';
import { openAddFood } from '../support/addFood';
import { onlineSource } from '../support/onlineFixtures';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-58: searching online is on request, never as the person types; the
 * first time it asks; what is found is listed with its source and the one
 * picked is kept on the phone.
 */
const today = CalendarDate.of(2026, 10, 20);
let repos: InMemoryRepositories;
let source: InMemoryOnlineFoodSource;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  source = onlineSource();
});

async function searched(words = 'peanut noodle') {
  renderApp(repos, today, { change: (services) => ({ ...services, onlineSources: [source] }) });
  await openTab('Food');
  const sheet = await openAddFood();
  await userEvent.type(within(sheet).getByRole('textbox', { name: 'Search foods' }), words);
  return sheet;
}

it('typing never asks online; a Search online action is offered under the results', async () => {
  const sheet = await searched();
  const button = await within(sheet).findByRole('button', { name: 'Search online' });
  expect(source.asked).toEqual([]);
  expect(button).toBeInTheDocument();
});

it('the first search asks, saying only the words are sent; once allowed, the foods found are listed with their source', async () => {
  const sheet = await searched();
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  const ask = await within(sheet).findByRole('group', { name: 'Look this up online?' });
  expect(ask).toHaveTextContent('Only the words you typed are sent to Open Food Facts');
  expect(source.asked).toEqual([]);
  await userEvent.click(within(ask).getByRole('button', { name: 'Just this once' }));
  await within(sheet).findByRole('heading', { name: 'Found online' });
  expect(source.asked).toEqual(['peanut noodle']);
  const row = within(sheet).getByRole('button', { name: /Thai peanut noodle kit/ });
  expect(row).toHaveTextContent('Community label (Open Food Facts)');
  expect(row).toHaveTextContent('found online');
});

it('picking a food found online keeps it on the phone and opens its amount step with its serving', async () => {
  await repos.preferences.saveOnlineLookup('always');
  const sheet = await searched();
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await userEvent.click(await within(sheet).findByRole('button', { name: /Thai peanut noodle kit/ }));
  await screen.findByRole('heading', { name: /Thai peanut noodle kit/ }, { timeout: 5000 });
  expect(screen.getByText(/1\/3 package/)).toBeInTheDocument();
});

it('nothing found online, and no connection, each say so', async () => {
  await repos.preferences.saveOnlineLookup('always');
  source.entries.length = 0;
  const sheet = await searched('quinoa');
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await within(sheet).findByText('Nothing found online for "quinoa".', {}, { timeout: 5000 });
  source.failWith(new Unavailable('No connection.'));
  await userEvent.clear(within(sheet).getByRole('textbox', { name: 'Search foods' }));
  await userEvent.type(within(sheet).getByRole('textbox', { name: 'Search foods' }), 'farro');
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await waitFor(() => expect(within(sheet).getByText(/could not be reached/)).toBeInTheDocument());
  expect(within(sheet).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

it('never means no Search online action at all', async () => {
  await repos.preferences.saveOnlineLookup('never');
  const sheet = await searched();
  await within(sheet).findByText(/No food database is on this phone yet/);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(within(sheet).queryByRole('button', { name: 'Search online' })).toBeNull();
});
