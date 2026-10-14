import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { dashboardLoaded } from '../support/dashboardLoaded';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openSettings } from '../support/openSettings';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-310, MM-311, MM-313: the Micros picture on Food, the sodium limit, and the water log. */
const today = CalendarDate.of(2026, 10, 10);
let repos: InMemoryRepositories;

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(
    typicalSetup({ onboardedOn: today.addDays(-30), healthCheckConfirmedOn: today }).copyWith({ unitSystem: 'metric' }),
  );
  await repos.weights.saveWeight(today, 82);
});

const fullDetailWithMicros = async () => {
  await repos.preferences.saveDetailLevel('full');
  await repos.preferences.saveMacroPicture('micros');
};

const banana = (date: CalendarDate) =>
  foodOn(date, { name: 'Banana', kcal: 105, proteinG: 1, carbsG: 27, fatG: 0, sodiumMg: 1 });

it('Micros is a third choice on Food at Full detail, and shows each nutrient with its coverage', async () => {
  await repos.preferences.saveDetailLevel('full');
  await repos.food.addFood(banana(today));
  await repos.food.addFood(foodOn(today, { name: 'Toast', kcal: 200, proteinG: 6, carbsG: 30, fatG: 4 }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Micros' }));
  expect(await screen.findByText('Also on the label')).toBeInTheDocument();
  expect(screen.getByText('Sodium, 1 milligrams, from 1 of 2 foods')).toBeInTheDocument();
  expect(screen.getByText(/^Not stated by any food: Potassium, Calcium, Iron/)).toBeInTheDocument();
  expect(await first(repos.preferences.watchMacroPicture())).toBe('micros');
});

// Owner, 2026-10-14 (the panel's PD-1): Food is the one home of Micros.
it('the Dashboard offers no Micros, and a remembered Micros shows the grams there', async () => {
  await fullDetailWithMicros();
  await repos.food.addFood(banana(today));
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.queryByRole('button', { name: 'Micros' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Grams' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.queryByText('Also on the label')).not.toBeInTheDocument();
});

it('below Full detail a remembered Micros shows the grams on Food too', async () => {
  await repos.preferences.saveMacroPicture('micros');
  await repos.food.addFood(banana(today));
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('button', { name: 'Grams' });
  expect(screen.queryByRole('button', { name: 'Micros' })).not.toBeInTheDocument();
  expect(screen.queryByText('Also on the label')).not.toBeInTheDocument();
});

it('a reference is drawn as a marker, with what it means said once', async () => {
  await fullDetailWithMicros();
  await repos.food.addFood(
    foodOn(today, { name: 'Lentils', kcal: 230, proteinG: 18, carbsG: 40, fatG: 1, micros: new Micronutrients({ iron: 6.6 }) }),
  );
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('Iron, 7 milligrams, reference 8 milligrams')).toBeInTheDocument();
  expect(screen.getByText(/^Reference: a daily amount for a healthy man of your age, as an average over many days/)).toBeInTheDocument();
});

it('pregnant: no reference marker, and the care-team line', async () => {
  await fullDetailWithMicros();
  await repos.setup.saveSetup(
    typicalSetup({ sex: 'female', screening: new ScreeningAnswers({ pregnant: true }), onboardedOn: today.addDays(-30) }),
  );
  await repos.food.addFood(
    foodOn(today, { name: 'Lentils', kcal: 230, proteinG: 18, carbsG: 40, fatG: 1, micros: new Micronutrients({ iron: 6.6 }) }),
  );
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText(/ask your care team which apply/)).toBeInTheDocument();
  expect(screen.getByText('Iron, 7 milligrams')).toBeInTheDocument();
  expect(document.querySelectorAll('.mm-progress-nutrient')).toHaveLength(0);
});

it('over the sodium limit, the row keeps the amount and says by how much, in the same colour', async () => {
  await fullDetailWithMicros();
  await repos.preferences.saveSodiumLimit(2300, today.addDays(-5));
  await repos.food.addFood(foodOn(today, { name: 'Soup', kcal: 300, proteinG: 10, carbsG: 40, fatG: 8, sodiumMg: 2600 }));
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('Sodium, 2,600 of 2,300 milligrams, 300 milligrams over your limit')).toBeInTheDocument();
});

// MM-316: the Micros picture said "Nothing logged yet today." on a past day.
it('a past day with nothing logged never says "today" in the Micros picture', async () => {
  await fullDetailWithMicros();
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  await screen.findByText('Yesterday');
  expect(screen.queryByText(/today\./i)).not.toBeInTheDocument();
});

it('the sodium limit refuses an amount below 1,500 mg and says the range', async () => {
  await repos.preferences.saveSodiumLimit(2300, today);
  renderApp(repos, today);
  const settings = await openSettings();
  const field = await settings.findByRole('textbox', { name: 'Daily sodium limit, milligrams' });
  await userEvent.clear(field);
  await userEvent.type(field, '800');
  await userEvent.click(settings.getByRole('button', { name: 'Save sodium limit' }));
  expect(await settings.findByText('That limit is out of range.')).toBeInTheDocument();
  expect(settings.getByText('A whole number from 1,500 to 6,000 mg.')).toBeInTheDocument();
  expect((await first(repos.preferences.watchNutritionGoals())).sodiumLimitMg).toBe(2300);
});

it('switched on, the sodium limit starts at 2,300 mg and is kept', async () => {
  renderApp(repos, today);
  const settings = await openSettings();
  await userEvent.click(await settings.findByRole('switch', { name: /^Daily sodium limit/ }));
  await expect.poll(async () => (await first(repos.preferences.watchNutritionGoals())).sodiumLimitMg).toBe(2300);
  expect((await first(repos.preferences.watchNutritionGoals())).sodiumLimitSince).toBe(today);
});

it('a glass from the Dashboard in one tap, said with the total, and undone', async () => {
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.getByText('No water yet today')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Add a glass of water' }));
  expect(await screen.findByText('Added a glass: 0.25 L today')).toBeInTheDocument();
  expect((await first(repos.water.watchWater(today))).map((e) => e.ml)).toEqual([250]);
  await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today))).length).toBe(0);
});

it('on Food: a bottle, another amount, and a removal, each said, on the day shown', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  await screen.findByText('Yesterday');
  await userEvent.click(screen.getByRole('button', { name: /^Bottle, 500\s+ml of water$/ }));
  expect(await screen.findByText('Added 0.5 L: 0.5 L yesterday')).toBeInTheDocument();
  const other = screen.getByRole('button', { name: 'Other amount of water' });
  await userEvent.click(other);
  expect(other).toHaveAttribute('aria-expanded', 'true');
  await userEvent.type(screen.getByRole('textbox', { name: 'Water, millilitres' }), '330');
  await userEvent.click(screen.getByRole('button', { name: 'Save water' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today.addDays(-1)))).map((e) => e.ml)).toEqual([500, 330]);
  expect(await first(repos.water.watchWater(today))).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: 'Remove 0.33 L of water' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today.addDays(-1)))).length).toBe(1);
  await userEvent.click(within(document.body).getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today.addDays(-1)))).length).toBe(2);
});

it('another amount over 3,000 ml is refused with the range', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Other amount of water' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Water, millilitres' }), '5000');
  await userEvent.click(screen.getByRole('button', { name: 'Save water' }));
  expect(await screen.findByText('That is more than one drink can be.')).toBeInTheDocument();
  expect(screen.getByText('Up to 3,000 ml at a time.')).toBeInTheDocument();
  expect(await first(repos.water.watchWater(today))).toEqual([]);
});

it('with a goal reached, the summary says so once; with none, nothing about a goal', async () => {
  await repos.preferences.saveWaterGoal(2000);
  for (const ml of [1500, 750]) {
    await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml, at: new Date(2026, 9, 10, 9) }));
  }
  renderApp(repos, today);
  await openTab('Food');
  expect(await screen.findByText('2.25 L · Goal reached')).toBeInTheDocument();
});

it('drinks logged as food are not water', async () => {
  await repos.food.addFood(foodOn(today, { name: 'Milk', kcal: 250, proteinG: 16, carbsG: 24, fatG: 10 }));
  renderApp(repos, today);
  await dashboardLoaded();
  expect(screen.getByText('No water yet today')).toBeInTheDocument();
});

// MM-317: after another amount is saved, focus goes back to the button that opened the field.
it('after another amount is saved, focus is back on Other amount', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Other amount of water' }));
  await userEvent.type(screen.getByRole('textbox', { name: 'Water, millilitres' }), '330');
  await userEvent.click(screen.getByRole('button', { name: 'Save water' }));
  await expect
    .poll(() => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label'))
    .toBe('Other amount of water');
});
