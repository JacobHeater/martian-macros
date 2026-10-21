import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { enterManually, foodSheet, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-438: no screen has an "Add food" button; a meal's "+" is how food is added. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
});

it('the Dashboard has no Add food, weighed in today or not', async () => {
  renderApp(repos, today);
  await screen.findByRole('button', { name: 'Save weigh-in' });
  expect(screen.queryByRole('button', { name: 'Add food' })).not.toBeInTheDocument();
  await userEvent.type(screen.getByRole('textbox', { name: 'Today’s weigh-in' }), '181.4{Enter}');
  await screen.findByRole('status');
  expect(screen.queryByRole('button', { name: 'Add food' })).not.toBeInTheDocument();
});

it('Food has no floating Add food', async () => {
  await repos.weights.saveWeight(today, 82);
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('heading', { name: 'Breakfast' });
  expect(screen.queryByRole('button', { name: 'Add food' })).not.toBeInTheDocument();
  expect(document.querySelector('.mm-fab')).toBeNull();
});

it('a meal’s "+" adds to that meal, whatever the hour', async () => {
  await repos.weights.saveWeight(today, 82);
  renderApp(repos, today, { hour: 8 });
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Add food to dinner' }));
  const sheet = await foodSheet();
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', 'Eggs');
  await typeIn(sheet, 'Protein g', '12');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).map((entry) => entry.meal)).toEqual(['dinner']);
});
