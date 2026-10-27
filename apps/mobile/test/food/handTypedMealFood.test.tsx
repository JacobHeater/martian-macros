import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { entryOfMealItem } from '../../src/domain/food/meal/entryOfMealItem';
import { parseMealAnalysis } from '../../src/domain/food/meal/parseMealAnalysis';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import type { FoodCatalog } from '../../src/foodCatalog/FoodCatalog';
import { cleanMealAnswer } from '../../src/gallery/screens/storyMealAnswers';
import { typeIn } from '../support/addFood';
import { first } from '../support/first';
import { fixtureCatalog, withCatalog } from '../support/fixtureCatalog';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/**
 * MM-646: a food typed by hand into a meal says how its grams were
 * measured, as the typed form asks, instead of being logged as a photo
 * estimate. MM-647: "Look up" offers the foods the name finds, and the one
 * chosen gives its numbers; the first is never taken unasked.
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
  const reading = parseMealAnalysis(cleanMealAnswer);
  if (reading.kind !== 'read') throw new Error(reading.reason);
  for (const item of reading.draft.items) {
    await repos.food.addFood(entryOfMealItem(item, { date: today, meal: 'dinner', eatenAt: 19 * 60, loggedMeal: { key: 'k1', name: 'Chicken and rice' } }));
  }
});

const logged = () => first(repos.food.watchFood(today));

/** Opens View meal on the logged meal and its form for a food added by hand. */
async function openAddAFood(): Promise<HTMLElement> {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'View Chicken and rice' }));
  const sheet = await screen.findByRole('dialog', { name: 'View meal' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add a food' }));
  return sheet;
}

/** Every number a logged meal's food needs (MM-587), typed in. */
async function typeAWholeFood(sheet: HTMLElement): Promise<void> {
  await typeIn(sheet, 'Food', 'Butter');
  await typeIn(sheet, 'Grams eaten', '10');
  await typeIn(sheet, 'Calories', '72');
  await typeIn(sheet, 'Protein g', '0');
  await typeIn(sheet, 'Carbs g', '0');
  await typeIn(sheet, 'Fat g', '8');
  await typeIn(sheet, 'Fiber g', '0');
  await typeIn(sheet, 'Sugars g', '0');
  await typeIn(sheet, 'Sat. fat g', '5');
  await typeIn(sheet, 'Sodium mg', '90');
}

it('MM-646: a food typed by hand must say how it was measured, and is logged as measured that way', async () => {
  const sheet = await openAddAFood();
  await typeAWholeFood(sheet);
  // Only an analysis makes a photo estimate: it is not offered for a food typed by hand.
  const methods = within(sheet).getByRole('group', { name: 'How was it measured?' });
  expect(within(methods).queryByRole('button', { name: 'Photo estimate' })).not.toBeInTheDocument();
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add food' }));
  expect(await within(sheet).findByRole('alert')).toHaveTextContent('Say how it was measured.');
  expect((await logged()).length, 'not added until it says').toBe(3);
  await userEvent.click(within(methods).getByRole('button', { name: 'Weighed' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add food' }));
  await expect.poll(async () => (await logged()).length).toBe(4);
  const butter = (await logged()).find((f) => f.name === 'Butter');
  expect(butter?.source).toBe('weighed');
  expect(butter?.portion).toMatchObject({ method: 'weighed', basis: 'calculated', quantity: 10, unit: 'gram' });
  expect(butter?.loggedMeal?.key, 'a food of the meal').toBe('k1');
  expect(butter?.evidence?.kind).toBe('yours');
});

it('MM-646: the assistant’s own food keeps its photo estimate unless the person says otherwise', async () => {
  renderApp(repos, today, { change: withCatalog(catalog) });
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'View Chicken and rice' }));
  const sheet = await screen.findByRole('dialog', { name: 'View meal' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'More actions for White rice' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  const methods = within(sheet).getByRole('group', { name: 'How was it measured?' });
  expect(within(methods).getByRole('button', { name: 'Photo estimate' })).toHaveAttribute('aria-pressed', 'true');
  await typeIn(sheet, 'Grams eaten', '200');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Save food' }));
  await expect.poll(async () => (await logged()).find((f) => f.name === 'White rice')?.portion?.quantity).toBe(200);
  expect((await logged()).find((f) => f.name === 'White rice')?.source).toBe('photoEstimate');
  // Said to have been weighed, it is.
  await userEvent.click(within(sheet).getByRole('button', { name: 'More actions for White rice' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Change' }));
  await userEvent.click(within(within(sheet).getByRole('group', { name: 'How was it measured?' })).getByRole('button', { name: 'Weighed' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Save food' }));
  await expect.poll(async () => (await logged()).find((f) => f.name === 'White rice')?.source).toBe('weighed');
});

it('MM-647: Look up offers the foods the name finds, and the one pressed gives its numbers at these grams', async () => {
  const sheet = await openAddAFood();
  await typeIn(sheet, 'Food', 'chicken breast');
  await typeIn(sheet, 'Grams eaten', '100');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Look up in the app’s foods' }));
  // Both chicken breasts of the pack are offered; nothing is taken yet.
  // Said as a status, so a reader hears it.
  expect((await within(sheet).findByText(/foods matched\. Press the one it is\./)).getAttribute('role')).toBe('status');
  expect(within(sheet).getByRole('textbox', { name: 'Calories' })).toHaveValue('');
  await userEvent.click(within(sheet).getByRole('button', { name: /^Chicken breast, cooked/ }));
  expect(within(sheet).getByText('Using Chicken breast, cooked.')).toBeInTheDocument();
  expect(within(sheet).queryByRole('button', { name: /^Chicken breast, raw/ }), 'the choice is made').not.toBeInTheDocument();
  expect(within(sheet).getByRole('textbox', { name: 'Calories' })).toHaveValue('165');
  await userEvent.click(within(within(sheet).getByRole('group', { name: 'How was it measured?' })).getByRole('button', { name: 'Weighed' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Add food' }));
  await expect.poll(async () => (await logged()).find((f) => f.name === 'chicken breast')?.kcal).toBe(165);
  expect((await logged()).find((f) => f.name === 'chicken breast')?.evidence?.kind, 'matched, not typed').toBe('matched');
});

it('MM-647: a name nothing matches is said, and nothing is offered', async () => {
  const sheet = await openAddAFood();
  await typeIn(sheet, 'Food', 'zzz');
  await typeIn(sheet, 'Grams eaten', '50');
  await userEvent.click(within(sheet).getByRole('button', { name: 'Look up in the app’s foods' }));
  expect((await within(sheet).findByText('Nothing in the app’s foods matched “zzz”.')).getAttribute('role')).toBe('status');
});
