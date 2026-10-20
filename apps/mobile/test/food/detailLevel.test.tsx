import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { enterManually, openAddFood, press, typeIn } from '../support/addFood';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-49: the Detail setting changes what is shown, never what is stored. Carried over from detail_level_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'lunch',
      name: 'Lentils',
      kcal: 230,
      proteinG: 18,
      carbsG: 40,
      fatG: 1,
      source: 'weighed',
      fiberG: 16,
      sodiumMg: 4,
    }),
  );
});

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByText('Lentils');
}

it('Standard shows the macros and no extras', async () => {
  await openFood();
  // Carbs are shown net by default (MM-396): 40 g less 16 g fiber.
  expect(screen.getAllByText('Net carbs').length).toBeGreaterThan(0);
  expect(screen.getByText(/P 18 · C 24 · F 1/)).toBeInTheDocument();
  expect(document.querySelector('.food-entry-extras')).toBeNull();
});

it('Full reveals what was stored all along', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  const extras = await screen.findByText(/Fiber 16 g/);
  // Net is the entry's own figure, so the line gives the total (MM-396, the designer's PD-1).
  expect(extras).toHaveTextContent('Total carbs 40 g');
  expect(extras).toHaveTextContent('Sodium 4 mg');
});

it('Simple hides carbohydrate and fat, not the data', async () => {
  await repos.preferences.saveDetailLevel('simple');
  await openFood();
  expect(await screen.findByText('P 18')).toBeInTheDocument();
  // The hero shows protein alone; the macronutrient split still names all three.
  const hero = document.querySelector('.mm-hero');
  expect(hero).not.toHaveTextContent('Carbs');
  expect(hero).not.toHaveTextContent('Fat');
  expect(screen.queryByText(/C 40/)).not.toBeInTheDocument();
  const stored = await first(repos.food.watchFood(today));
  expect(stored).toHaveLength(1);
  expect(stored[0]?.carbsG).toBe(40);
  expect(stored[0]?.fatG).toBe(1);
});

it('the fiber line shows at Full, with its guide, never at Standard', async () => {
  await openFood();
  expect(screen.queryByText('Fiber')).not.toBeInTheDocument();
});

it('Full shows fiber against the guide', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  // MM-336: a row of the hero, the name at the start and the figures at the end.
  expect((await screen.findByText('Fiber')).parentElement?.textContent).toMatch(/^Fiber16 g · guide/);
});

it('too little fiber data says so and gives no total', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Typed meal', kcal: 800, proteinG: 30, carbsG: 80, fatG: 30 }));
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  expect((await screen.findByText('Fiber')).parentElement?.textContent).toBe('Fibernot enough data');
});

// MM-49: the add-food form follows the level too. Simple asks for calories and protein.
it('Simple: the typed form asks for calories and protein only, and says what it logs in those words', async () => {
  await repos.preferences.saveDetailLevel('simple');
  await openFood();
  const sheet = await openAddFood();
  await enterManually(sheet);
  expect(within(sheet).getByRole('textbox', { name: 'Protein g' })).toBeInTheDocument();
  expect(within(sheet).queryByRole('textbox', { name: 'Carbs g' })).not.toBeInTheDocument();
  expect(within(sheet).queryByRole('textbox', { name: 'Fat g' })).not.toBeInTheDocument();
  expect(within(sheet).queryByText('Also on the label')).not.toBeInTheDocument();
  await typeIn(sheet, 'Food name', 'Shake');
  await typeIn(sheet, 'Protein g', '30');
  await typeIn(sheet, /^Calories/, '200');
  expect(within(sheet).getByTestId('logged-totals')).toHaveTextContent(/^Logs 200 kcal · 30 g protein$/);
  expect(within(sheet).queryByText('Macro split')).not.toBeInTheDocument();
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(2);
  const shake = (await first(repos.food.watchFood(today))).find((e) => e.name === 'Shake');
  expect(shake?.proteinG).toBe(30);
  expect(shake?.carbsG).toBe(0);
});

// MM-49: Full takes the label's other lines, and the row shows them.
it('Full: the typed form takes fiber, sugars, saturated fat and sodium, stores them and shows them', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  const sheet = await openAddFood();
  await enterManually(sheet);
  expect(within(sheet).getByText('Also on the label')).toBeInTheDocument();
  await typeIn(sheet, 'Food name', 'Granola');
  await typeIn(sheet, 'Protein g', '10');
  await typeIn(sheet, 'Carbs g', '60');
  await typeIn(sheet, 'Fat g', '12');
  await typeIn(sheet, 'Fiber g', '6');
  await typeIn(sheet, 'Sugars g', '18');
  await typeIn(sheet, 'Saturated fat g', '2');
  await typeIn(sheet, 'Sodium mg', '150');
  await typeIn(sheet, /^Calories/, '390');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(2);
  const granola = (await first(repos.food.watchFood(today))).find((e) => e.name === 'Granola');
  expect(granola?.fiberG).toBe(6);
  expect(granola?.sodiumMg).toBe(150);
  expect(granola?.micros.of('sugars')).toBe(18);
  expect(granola?.micros.of('saturatedFat')).toBe(2);
  const extras = await screen.findByText(/Sugars 18 g/);
  expect(extras).toHaveTextContent('Fiber 6 g');
  expect(extras).toHaveTextContent('Saturated fat 2 g');
  expect(extras).toHaveTextContent('Sodium 150 mg');
});

it('Full: two label servings multiply the other lines too, and an edit brings them back per serving', async () => {
  await repos.preferences.saveDetailLevel('full');
  await openFood();
  let sheet = await openAddFood();
  await enterManually(sheet);
  await typeIn(sheet, 'Food name', 'Bar');
  await typeIn(sheet, 'Servings eaten', '2');
  await typeIn(sheet, 'Protein g', '10');
  await typeIn(sheet, 'Sugars g', '9');
  await typeIn(sheet, /^Calories/, '200');
  await press(sheet, 'Log it');
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(2);
  const bar = (await first(repos.food.watchFood(today))).find((e) => e.name === 'Bar');
  expect(bar?.micros.of('sugars')).toBe(18);
  expect(bar?.fiberG, 'blank stays unknown, never zero').toBeUndefined();
  await userEvent.click(screen.getByRole('button', { name: 'Edit Bar' }));
  sheet = await screen.findByRole('dialog', { name: 'Edit food' });
  await press(sheet, 'Edit nutrition per serving');
  expect(within(sheet).getByRole<HTMLInputElement>('textbox', { name: 'Sugars g' }).value).toBe('9');
});

// MM-49: sugars and saturated fat from a format 3 pack show at Full, stored all along.
it('Full shows the sugars and saturated fat an entry carries; Standard does not', async () => {
  await repos.food.addFood(
    new FoodEntry({
      id: 0,
      date: today,
      meal: 'snack',
      name: 'Yogurt',
      kcal: 150,
      proteinG: 8,
      carbsG: 17,
      fatG: 5,
      source: 'labelServing',
      micros: new Micronutrients({ sugars: 15, saturatedFat: 3 }),
    }),
  );
  await openFood();
  expect(screen.queryByText(/Sugars 15 g/)).not.toBeInTheDocument();
  await repos.preferences.saveDetailLevel('full');
  const extras = await screen.findByText(/Sugars 15 g/);
  expect(extras).toHaveTextContent('Saturated fat 3 g');
});
