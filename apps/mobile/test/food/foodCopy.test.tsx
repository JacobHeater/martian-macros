import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import type { Meal } from '../../src/domain/Meal';
import { InMemoryRepositories } from '../../src/fixtures/InMemoryRepositories';
import { typicalSetup } from '../../src/fixtures/typicalSetup';
import { entriesCopiedTo } from '../../src/food/entriesCopiedTo';
import { first } from '../support/first';
import { foodOn } from '../support/foodOn';
import { openTab } from '../support/openTab';
import { renderApp } from '../support/renderApp';

/** MM-47: copy yesterday, copy one meal to today. Carried over from food_copy_test.dart. */
const today = CalendarDate.of(2026, 10, 5);
let repos: InMemoryRepositories;

const entry = (on: CalendarDate, meal: Meal, name: string) =>
  foodOn(on, { name, meal, kcal: 300, proteinG: 20, carbsG: 30, fatG: 10 });

beforeEach(async () => {
  repos = new InMemoryRepositories();
  await repos.preferences.saveThemePreference('martian');
  await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-40), healthCheckConfirmedOn: today }));
  await repos.weights.saveWeight(today, 82);
  const y = today.addDays(-1);
  await repos.food.addFood(entry(y, 'breakfast', 'Oats'));
  await repos.food.addFood(entry(y, 'breakfast', 'Eggs'));
  await repos.food.addFood(entry(y, 'dinner', 'Pasta'));
  await repos.dayMarks.setCompleteness(y, 'complete');
});

async function openFood(): Promise<void> {
  renderApp(repos, today);
  await openTab('Food');
  await screen.findByRole('button', { name: 'Previous day' });
}

it('copies are new entries on the day, in the same or a given meal', () => {
  const copies = entriesCopiedTo(today, [entry(today.addDays(-1), 'dinner', 'Pasta')]);
  expect(copies).toHaveLength(1);
  expect(copies[0]?.id).toBe(0);
  expect(copies[0]?.date).toBe(today);
  expect(copies[0]?.meal).toBe('dinner');
  expect(entriesCopiedTo(today, [entry(today, 'dinner', 'Pasta')], { meal: 'lunch' })[0]?.meal).toBe('lunch');
});

it('Copy yesterday fills an empty day and leaves it unmarked', async () => {
  await openFood();
  await userEvent.click(await screen.findByRole('button', { name: 'Copy yesterday' }));
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(3);
  const copied = await first(repos.food.watchFood(today));
  expect(copied.map((e) => `${e.meal}:${e.name}`)).toEqual(['breakfast:Oats', 'breakfast:Eggs', 'dinner:Pasta']);
  expect(await first(repos.dayMarks.watchCompleteness(today))).toBe('unmarked');
  expect(screen.queryByRole('button', { name: 'Copy yesterday' })).not.toBeInTheDocument();
});

it('one meal from a past day copies to today', async () => {
  await openFood();
  await userEvent.click(screen.getByRole('button', { name: 'Previous day' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Copy breakfast to today' }));
  await expect.poll(async () => (await first(repos.food.watchFood(today))).length).toBe(2);
  expect((await first(repos.food.watchFood(today))).map((e) => e.name)).toEqual(['Oats', 'Eggs']);
});
