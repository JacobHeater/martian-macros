import { within } from '@testing-library/react';
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

/** MM-637 (the owner, 2026-10-26): a search's own foods and log stand apart from the food database's results. */
const today = CalendarDate.of(2026, 10, 26);
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

/** Whether `a` comes before `b` in the page. */
const before = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

it('MM-637: the logged banana is under "Your foods and meals", the database’s under "From the food database", below', async () => {
  await repos.food.addFood(foodOn(today.addDays(-1), { name: 'Banana', kcal: 105 }));
  const sheet = await search('banana');
  const own = await within(sheet).findByText('Your foods and meals');
  const database = await within(sheet).findByText('From the food database');
  const logged = within(sheet).getByRole('button', { name: /^Banana.*From your log/ });
  expect(before(own, logged)).toBe(true);
  expect(before(logged, database)).toBe(true);
});

it('MM-637: with nothing of their own, only the database’s heading', async () => {
  const sheet = await search('banana');
  expect(await within(sheet).findByText('From the food database')).toBeInTheDocument();
  expect(within(sheet).queryByText('Your foods and meals')).not.toBeInTheDocument();
});
