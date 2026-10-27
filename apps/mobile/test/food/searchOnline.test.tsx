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

/** Chooses the online results at the top of the list (MM-652), where the Search online action is. */
async function chooseOnline(sheet: HTMLElement) {
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Online' }));
}

it('typing never asks online; Online is a choice of results with a Search online action, and the empty-database sentence names it', async () => {
  const sheet = await searched();
  expect(await within(sheet).findByText(/No food database is on this phone yet/)).toHaveTextContent(/search online, or enter the food yourself/);
  await chooseOnline(sheet);
  const button = await within(sheet).findByRole('button', { name: 'Search online' });
  expect(source.asked).toEqual([]);
  expect(button).toBeInTheDocument();
});

it('the first search asks, saying only the words are sent; once allowed, the foods found are listed with their source', async () => {
  const sheet = await searched();
  await chooseOnline(sheet);
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  const ask = await within(sheet).findByRole('group', { name: 'Online lookup' });
  expect(ask).toHaveTextContent('Only the words you typed are sent to Open Food Facts');
  expect(source.asked).toEqual([]);
  // The action stays in place, off, while the question is open (the panel's F4).
  expect(within(sheet).getByRole('button', { name: 'Search online' })).toBeDisabled();
  await userEvent.click(within(ask).getByRole('button', { name: 'Just for now' }));
  const row = await within(sheet).findByRole('button', { name: /^Thai peanut noodle kit/ }, { timeout: 5000 });
  expect(source.asked).toEqual(['peanut noodle']);
  expect(row).toHaveTextContent('Community label (Open Food Facts)');
  expect(row).toHaveTextContent('Found online');
  expect(within(sheet).getByRole('status')).toHaveTextContent('1 found online.');
});

it('picking a food found online keeps it on the phone and opens its amount step with its serving', async () => {
  await repos.preferences.saveOnlineLookup('always');
  const sheet = await searched();
  await chooseOnline(sheet);
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await userEvent.click(await within(sheet).findByRole('button', { name: /^Thai peanut noodle kit/ }));
  await screen.findByRole('heading', { name: /^Thai peanut noodle kit/ }, { timeout: 5000 });
  expect(screen.getByText(/1\/3 package/)).toBeInTheDocument();
});

it('nothing found online, and no connection, each say so', async () => {
  await repos.preferences.saveOnlineLookup('always');
  source.entries.length = 0;
  const sheet = await searched('quinoa');
  await chooseOnline(sheet);
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await within(sheet).findByText('Nothing found online for "quinoa".', {}, { timeout: 5000 });
  source.failWith(new Unavailable('No connection.'));
  // Clearing the search clears the choice, so Online is chosen again for the next (MM-652).
  await userEvent.clear(within(sheet).getByRole('textbox', { name: 'Search foods' }));
  await userEvent.type(within(sheet).getByRole('textbox', { name: 'Search foods' }), 'farro');
  await chooseOnline(sheet);
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await waitFor(() => expect(within(sheet).getByRole('status')).toHaveTextContent(/The online food services could not be reached\./));
  expect(within(sheet).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
});

it('never, answered here, says once what changed and where (MM-58, the panel\u2019s F6)', async () => {
  const sheet = await searched();
  await chooseOnline(sheet);
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Search online' }));
  await userEvent.click(await within(sheet).findByRole('button', { name: 'Never' }));
  await waitFor(() => expect(within(sheet).getByRole('status')).toHaveTextContent(/Online lookup is off\. You can change that in Settings, under Data\./));
  expect(within(sheet).queryByRole('button', { name: 'Search online' })).toBeNull();
  expect(source.asked).toEqual([]);
});

it('never means no Online choice and no Search online action at all', async () => {
  await repos.preferences.saveOnlineLookup('never');
  const sheet = await searched();
  const sentence = await within(sheet).findByText(/No food database is on this phone yet/);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(within(sheet).queryByRole('button', { name: 'Online' })).toBeNull();
  expect(within(sheet).queryByRole('button', { name: 'Search online' })).toBeNull();
  expect(sentence, 'the sentence names only what is offered (the panel\u2019s F7)').not.toHaveTextContent(/search online/);
});
