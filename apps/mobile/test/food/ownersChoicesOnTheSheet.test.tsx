import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** The owner's choices of 2026-10-26 on the Add food sheet: MM-642 (the amount step's fold) and MM-643 (calories first). */
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

it('MM-642: the grade’s meaning, the source’s numbers and the split open from "About this food"; the Logs line stays', async () => {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  const sheet = await openAddFood();
  await typeIn(sheet, 'Search foods', 'banana');
  await userEvent.click((await within(sheet).findAllByRole('button', { name: /^Banana/ }))[0] as HTMLElement);
  const about = await within(sheet).findByRole('button', { name: 'About this food' });
  expect(about).toHaveAttribute('aria-expanded', 'false');
  expect(within(sheet).getByText(/^Per 100 g:/)).not.toBeVisible();
  expect(within(sheet).getByTestId('amount-macros')).toBeVisible();
  await userEvent.click(about);
  expect(within(sheet).getByText(/^Per 100 g:/)).toBeVisible();
  expect(within(sheet).getByText(/^Grade for the food itself|^No grade for this food/)).toBeVisible();
});

it('MM-643: in the manual form, calories come before the macros', async () => {
  renderApp(repos, today);
  const sheet = await openAddFood();
  await enterManually(sheet);
  const calories = within(sheet).getByRole('textbox', { name: /^Calories/ });
  const protein = within(sheet).getByRole('textbox', { name: 'Protein g' });
  expect(calories.compareDocumentPosition(protein) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await typeIn(sheet, 'Food name', 'Bar');
  await typeIn(sheet, /^Calories/, '200');
  await press(sheet, 'Log it');
});
