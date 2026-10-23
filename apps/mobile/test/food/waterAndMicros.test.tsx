import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { Micronutrients } from '../../src/domain/food/micros/Micronutrients';
import { ScreeningAnswers } from '../../src/domain/ScreeningAnswers';
import { WaterEntry } from '../../src/domain/water/WaterEntry';
import { WaterUnits } from '../../src/domain/water/WaterUnits';
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

it('MM-561: pressing a nutrient lists the foods that add the most of it, most first', async () => {
  await fullDetailWithMicros();
  for (const [name, iron] of [['Toast', 1], ['Lentils', 6.6], ['Spinach', 3]] as const) {
    await repos.food.addFood(foodOn(today, { name, kcal: 100, proteinG: 1, carbsG: 1, fatG: 1, micros: new Micronutrients({ iron }) }));
  }
  renderApp(repos, today);
  await openTab('Food');
  const row = await screen.findByRole('button', { name: /^Iron, 11 milligrams/ });
  expect(row).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('list', { name: 'Top foods for Iron' })).not.toBeInTheDocument();
  await userEvent.click(row);
  expect(row).toHaveAttribute('aria-expanded', 'true');
  const list = screen.getByRole('list', { name: 'Top foods for Iron' });
  expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Lentils, 7 milligramsLentils7 mg',
    'Spinach, 3 milligramsSpinach3 mg',
    'Toast, 1 milligramsToast1 mg',
  ]);
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
  await screen.findByRole('heading', { level: 1, name: 'Yesterday' });
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

// MM-325: on the owner's phone the save failed and the switch sprang back, saying nothing.
it('a sodium limit that cannot be saved says so, and the switch stays off', async () => {
  renderApp(repos, today, {
    change: (services) => {
      const preferences = Object.create(services.preferences) as typeof services.preferences;
      preferences.saveSodiumLimit = () => Promise.reject(new Error('no such column'));
      return { ...services, preferences };
    },
  });
  const settings = await openSettings();
  const limit = await settings.findByRole('switch', { name: /^Daily sodium limit/ });
  await userEvent.click(limit);
  expect(await screen.findByText('The sodium limit could not be saved. Nothing was changed.')).toBeInTheDocument();
  expect(limit).not.toBeChecked();
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

/** Presses the Water section's "+" and gives the Add water sheet (MM-318). */
async function openAddWater() {
  await userEvent.click(await screen.findByRole('button', { name: 'Add water' }));
  return within(await screen.findByRole('dialog', { name: 'Add water' }));
}

// MM-318: Water is a section like the meals: "+" in the header opens a sheet; rows delete from "More actions".
it('on Food: a bottle and another amount from the header, and a delete, each said, on the day shown', async () => {
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  await screen.findByRole('heading', { level: 1, name: 'Yesterday' });
  let sheet = await openAddWater();
  await userEvent.click(sheet.getByRole('button', { name: /^Bottle, 500\s+ml of water$/ }));
  expect(await screen.findByText('Added 0.5 L: 0.5 L yesterday')).toBeInTheDocument();
  expect(screen.queryByRole('dialog', { name: 'Add water' })).not.toBeInTheDocument();
  sheet = await openAddWater();
  await userEvent.type(sheet.getByRole('textbox', { name: 'Water, millilitres' }), '330');
  await userEvent.click(sheet.getByRole('button', { name: 'Save water' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today.addDays(-1)))).map((e) => e.ml)).toEqual([500, 330]);
  expect(await first(repos.water.watchWater(today))).toEqual([]);
  await userEvent.click(await screen.findByRole('button', { name: 'More actions for 0.33 L of water, added later' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today.addDays(-1)))).length).toBe(1);
  await userEvent.click(within(document.body).getByRole('button', { name: 'Undo' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today.addDays(-1)))).length).toBe(2);
});

it('the Water section folds like a meal, its total in the summary', async () => {
  // With the goal switched off, the summary is the total alone (MM-358).
  await repos.preferences.saveWaterGoalOff(true);
  await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml: 250, at: new Date(2026, 9, 10, 9) }));
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  expect(water.closest('.mm-section')).not.toBeNull();
  expect(within(water).getAllByText('0.25 L')).toHaveLength(2); // the summary, and the row's amount
  const toggle = within(water).getByRole('button', { name: /^Water/ });
  await userEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

it('another amount over 3,000 ml is refused with the range', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddWater();
  await userEvent.type(sheet.getByRole('textbox', { name: 'Water, millilitres' }), '5000');
  await userEvent.click(sheet.getByRole('button', { name: 'Save water' }));
  expect(await sheet.findByText('That is more than one drink can be.')).toBeInTheDocument();
  expect(sheet.getByText('Up to 3,000 ml at a time.')).toBeInTheDocument();
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

// MM-317: after another amount is saved, focus goes back to the control that opened it (MM-318: the header's "+").
it('after another amount is saved, focus is back on Add water', async () => {
  renderApp(repos, today);
  await openTab('Food');
  const sheet = await openAddWater();
  await userEvent.type(sheet.getByRole('textbox', { name: 'Water, millilitres' }), '330');
  await userEvent.click(sheet.getByRole('button', { name: 'Save water' }));
  await expect
    .poll(() => (document.activeElement as HTMLElement | null)?.getAttribute('aria-label'))
    .toBe('Add water');
});

// MM-319: water added to a past day never shows today's clock time on that day's row.
it('a drink added to yesterday shows no time from today, and its actions are told apart', async () => {
  await repos.water.addWater(new WaterEntry({ id: 0, date: today.addDays(-1), ml: 250, at: new Date(2026, 9, 9, 8) }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Previous day' }));
  await screen.findByRole('heading', { level: 1, name: 'Yesterday' });
  const sheet = await openAddWater();
  await userEvent.click(sheet.getByRole('button', { name: /^Glass, 250\s+ml of water$/ }));
  expect(await screen.findByText('Added later')).toBeInTheDocument();
  expect(screen.getByText('8:00 AM')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'More actions for 0.25 L of water at 8:00 AM' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'More actions for 0.25 L of water, added later' })).toBeInTheDocument();
});

// MM-318 (the panel's PD-1): pressing a drink opens Edit water, as a food opens Edit food; its time is kept.
it('pressing a drink edits its amount and keeps its time', async () => {
  await repos.water.addWater(new WaterEntry({ id: 0, date: today, ml: 250, at: new Date(2026, 9, 10, 8) }));
  renderApp(repos, today);
  await openTab('Food');
  await userEvent.click(await screen.findByRole('button', { name: 'Edit 0.25 L of water at 8:00 AM' }));
  const sheet = within(await screen.findByRole('dialog', { name: 'Edit water' }));
  const field = sheet.getByRole('textbox', { name: 'Water, millilitres' });
  expect(field).toHaveValue('250');
  await userEvent.clear(field);
  await userEvent.type(field, '330');
  await userEvent.click(sheet.getByRole('button', { name: 'Save water' }));
  await expect.poll(async () => (await first(repos.water.watchWater(today))).map((e) => [e.ml, e.at.getHours()])).toEqual([[330, 8]]);
  expect(await screen.findByText('Changed to 0.33 L')).toBeInTheDocument();
});

/** MM-326: how far the Water section's bar is filled, as its fill's width. */
const waterLevel = (water: HTMLElement) =>
  (water.querySelector('.mm-progress-water .mm-progress-fill') as HTMLElement | null)?.style.width;

const drink = (ml: number) => repos.water.addWater(new WaterEntry({ id: 0, date: today, ml, at: new Date(2026, 9, 10, 9) }));

// MM-326: the water pours into a bar across the section (the owner, 2026-10-15); the summary says glasses.
it('a gallon goal with 24 fl oz drunk fills the bar 3/16 of the way, folded or not', async () => {
  await repos.setup.saveSetup((await repos.setup.loadSetup())!.copyWith({ unitSystem: 'imperial' }));
  await repos.preferences.saveWaterGoal(WaterUnits.flOzToMl(128));
  for (let i = 0; i < 3; i++) await drink(WaterUnits.flOzToMl(8));
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  expect(await within(water).findByText('24 fl oz of 128 fl oz · 3 of 16 glasses')).toBeInTheDocument();
  await expect.poll(() => waterLevel(water)).toBe('18.75%');
  expect(water.querySelector('.mm-progress-water')).toHaveAttribute('aria-hidden', 'true');
  await userEvent.click(within(water).getByRole('button', { name: /^Water/ }));
  expect(within(water).queryByRole('button', { name: /^Edit .* of water/ })).not.toBeInTheDocument();
  expect(water.querySelector('.mm-progress-water')).toBeVisible();
});

it('the bar pours from empty when it appears, and again when the section opens', async () => {
  await repos.preferences.saveWaterGoal(2000);
  await drink(1000);
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  await expect.poll(() => waterLevel(water)).toBe('50%');
  const toggle = within(water).getByRole('button', { name: /^Water/ });
  await userEvent.click(toggle);
  const folded = water.querySelector('.mm-progress-water');
  await userEvent.click(toggle);
  expect(water.querySelector('.mm-progress-water')).not.toBe(folded); // drawn anew, so it fills again
  await expect.poll(() => waterLevel(water)).toBe('50%');
});

it('a goal with nothing yet says its glasses over an empty bar, and a glass from the sheet raises it', async () => {
  await repos.preferences.saveWaterGoal(2000);
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  expect(await within(water).findByText('Goal 2 L · 8 glasses')).toBeInTheDocument();
  await expect.poll(() => waterLevel(water)).toBe('0%');
  const sheet = await openAddWater();
  await userEvent.click(sheet.getByRole('button', { name: /^Glass, 250\s+ml of water$/ }));
  expect(await within(water).findByText(/· 1 of 8 glasses$/)).toBeInTheDocument();
  await expect.poll(() => waterLevel(water)).toBe('12.5%');
  expect(water.querySelector('.mm-progress-wave')).not.toBeNull(); // the change sloshes
});

it('half a glass is said as a half', async () => {
  await repos.preferences.saveWaterGoal(2000);
  await drink(375);
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  expect(await within(water).findByText(/· 1½ of 8 glasses$/)).toBeInTheDocument();
});

it('the goal reached fills the bar and carries the check mark; switched off, no bar', async () => {
  await repos.preferences.saveWaterGoal(1500);
  await drink(2250);
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  await within(water).findByText('2.25 L · Goal reached');
  await expect.poll(() => waterLevel(water)).toBe('100%');
  expect(water.querySelector('.food-meal-marker')).not.toBeNull();
  await repos.preferences.saveWaterGoalOff(true);
  await expect.poll(() => water.querySelector('.mm-progress-water')).toBeNull();
  expect(within(water).queryByText(/glass/)).not.toBeInTheDocument();
});

// MM-328: a new day's water is drawn anew, filling from empty, not moved from the old day's level as an add.
it('changing the day draws the bar anew for that day', async () => {
  await repos.preferences.saveWaterGoal(2000);
  await drink(1000);
  await repos.water.addWater(new WaterEntry({ id: 0, date: today.addDays(-1), ml: 2000, at: new Date(2026, 9, 9, 9) }));
  renderApp(repos, today);
  await openTab('Food');
  let water = await screen.findByRole('region', { name: 'Water' });
  await expect.poll(() => waterLevel(water)).toBe('50%');
  const before = water.querySelector('.mm-progress-water');
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  await screen.findByRole('heading', { level: 1, name: 'Yesterday' });
  water = screen.getByRole('region', { name: 'Water' });
  await expect.poll(() => waterLevel(water)).toBe('100%');
  expect(water.querySelector('.mm-progress-water')).not.toBe(before);
});

// MM-358: the water goal is on by default, suggested for the person.
it('with no goal set, the Water section fills toward the one suggested for the person', async () => {
  await drink(1000);
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  expect(water.querySelector('.mm-progress-water')).not.toBeNull();
  expect(within(water).getByText(/^1 L of [\d.]+ L · /)).toBeInTheDocument();
});

it('MM-358: where a care team sets what is drunk, no goal is suggested and there is no bar', async () => {
  const setup = await first(repos.setup.watchSetup());
  await repos.setup.saveSetup(setup!.copyWith({ screening: new ScreeningAnswers({ fluidLimitedByClinician: true }) }));
  await drink(1000);
  renderApp(repos, today);
  await openTab('Food');
  const water = await screen.findByRole('region', { name: 'Water' });
  expect(water.querySelector('.mm-progress-water')).toBeNull();
  expect(within(water).queryByText(/glass/)).not.toBeInTheDocument();
});
