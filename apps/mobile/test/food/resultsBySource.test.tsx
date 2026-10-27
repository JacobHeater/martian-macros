import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { openAddFood, typeIn } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-652 (the owner, 2026-10-27): a search's results come one list at a time, chosen at the top: the person's
 * own, the food database or online; their own first when any matched, else the database. It took over MM-637's
 * two headings.
 */
const today = CalendarDate.of(2026, 10, 27);
let repos: InMemoryRepositories;
let catalog: FoodCatalog;

beforeAll(async () => {
  catalog = await fixtureCatalog();
});

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
});

async function search(query: string): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', query);
  return sheet;
}

const chooser = (sheet: HTMLElement) => within(sheet).getByRole('group', { name: 'Results from' });

it('MM-652: with a logged banana, Yours is chosen and lists it; Database switches to the food database’s, alone', async () => {
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Banana', kcal: 105 }));
  const sheet = await search('banana');
  const logged = await within(sheet).findByRole('button', { name: /^Banana.*From your log/ });
  expect(within(chooser(sheet)).getByRole('button', { name: 'Yours' })).toHaveAttribute('aria-pressed', 'true');
  expect(within(sheet).queryByRole('button', { name: /^Banana · 1 medium/ })).not.toBeInTheDocument();
  await userEvent.click(within(chooser(sheet)).getByRole('button', { name: 'Database' }));
  expect(await within(sheet).findByRole('button', { name: /^Banana · 1 medium/ })).toBeInTheDocument();
  expect(logged).not.toBeInTheDocument();
  expect(within(chooser(sheet)).getByRole('button', { name: 'Database' })).toHaveAttribute('aria-pressed', 'true');
});

it('MM-652: with nothing of their own, Database is chosen; Yours says nothing of theirs matches', async () => {
  const sheet = await search('banana');
  expect(await within(sheet).findByRole('button', { name: /^Banana · 1 medium/ })).toBeInTheDocument();
  expect(within(chooser(sheet)).getByRole('button', { name: 'Database' })).toHaveAttribute('aria-pressed', 'true');
  await userEvent.click(within(chooser(sheet)).getByRole('button', { name: 'Yours' }));
  expect(await within(sheet).findByText('Nothing of yours matches "banana".')).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: /^Banana · 1 medium/ })).not.toBeInTheDocument();
});

it('MM-652: no online source, no Online choice; the choice made is kept for the search and cleared with it', async () => {
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Banana', kcal: 105 }));
  const sheet = await search('banana');
  await within(sheet).findByRole('button', { name: /^Banana.*From your log/ });
  expect(within(chooser(sheet)).queryByRole('button', { name: 'Online' })).not.toBeInTheDocument();
  await userEvent.click(within(chooser(sheet)).getByRole('button', { name: 'Database' }));
  await userEvent.type(within(sheet).getByRole('textbox', { name: 'Search foods' }), 's');
  expect(within(chooser(sheet)).getByRole('button', { name: 'Database' })).toHaveAttribute('aria-pressed', 'true');
  await typeIn(sheet, 'Search foods', '');
  await typeIn(sheet, 'Search foods', 'banana');
  expect(await within(sheet).findByRole('button', { name: /^Banana.*From your log/ })).toBeInTheDocument();
  expect(within(chooser(sheet)).getByRole('button', { name: 'Yours' })).toHaveAttribute('aria-pressed', 'true');
});
