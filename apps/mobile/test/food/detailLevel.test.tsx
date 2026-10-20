import { screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { FoodEntry } from '../../src/domain/FoodEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
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
