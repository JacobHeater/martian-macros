import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { openAddFood, press, typeIn } from '../support/addFood';
import { expectClose } from '../support/expectClose';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-636: a food whose source states a serving as a volume ("1 cup" of 158 g)
 * can be measured in other volumes through it; one with no such serving is
 * offered none.
 */
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

async function pick(query: string, name: RegExp): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', query);
  const results = await within(sheet).findAllByRole('button', { name });
  await userEvent.click(results.find((row) => !/Your recent food|From your log/.test(row.textContent ?? '')) ?? (results[0] as HTMLElement));
  await within(sheet).findByRole('button', { name: 'Log it' });
  return sheet;
}

it('MM-636: two tablespoons of rice, weighed through its 1 cup serving of 158 g', async () => {
  const sheet = await pick('white rice cooked', /^White rice, cooked/);
  expect(within(sheet).queryByRole('button', { name: 'Cups' }), 'the cup is its own serving').not.toBeInTheDocument();
  await press(sheet, 'Tablespoons');
  await typeIn(sheet, /^Amount/, '2');
  expect(within(sheet).getByText('20 g')).toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(1);
  const [rice] = await first(repos.food.watchFood(today));
  expectClose(rice?.kcal ?? 0, (130 * (158 / 16) * 2) / 100, 1e-9);
  expect(rice?.portion?.unit).toBe('tablespoon');
  expect(rice?.portion?.method).toBe('householdMeasure');
  expect(rice?.portion?.reference?.servingMilliliters).toBeCloseTo(236.5882365, 6);
});

it('MM-636: a food with no serving measured by volume offers no volume', async () => {
  const sheet = await pick('banana', /^Banana/);
  for (const name of ['Cups', 'Tablespoons', 'Teaspoons']) {
    expect(within(sheet).queryByRole('button', { name }), name).not.toBeInTheDocument();
  }
  expect(screen.queryByText(/density/i)).not.toBeInTheDocument();
});
