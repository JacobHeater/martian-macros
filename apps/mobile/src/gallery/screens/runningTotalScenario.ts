import type { CalendarDate } from '../../domain/CalendarDate';
import { FoodEntry } from '../../domain/FoodEntry';
import type { Meal } from '../../domain/Meal';
import { typicalSetup } from '../../fixtures/typicalSetup';
import type { InMemoryRepositories } from '../../fixtures/InMemoryRepositories';
import type { StoryScenario } from './StoryScenario';
import { storyTargets } from './storyTargets';

const meal = (date: CalendarDate, which: Meal, name: string, kcal: number, eatenAt: number) =>
  new FoodEntry({ id: 0, date, meal: which, name, kcal, proteinG: kcal / 20, carbsG: kcal / 9, fatG: kcal / 30, source: 'weighed', eatenAt });

const day = async (repos: InMemoryRepositories, date: CalendarDate, dinner: number) => {
  await repos.food.addFood(meal(date, 'breakfast', 'Biscuit, eggs and sausage', 675, 7 * 60 + 40));
  await repos.food.addFood(meal(date, 'lunch', 'Chicken and pasta', 713, 12 * 60 + 30));
  await repos.food.addFood(meal(date, 'dinner', 'Cheeseburger and fries', dinner, 19 * 60 + 15));
};

/**
 * The owner's day of 2026-10-22 with meal times (MM-571, MM-572): 2,588 kcal
 * against 2,175, passed at dinner, drawn as yesterday so the story's noon
 * clock puts no "now" before dinner; `usualDays` days before it with meal
 * times draw the usual day, or show how many it still waits for.
 */
export const runningTotalScenario =
  ({ usualDays }: { usualDays: number }): StoryScenario =>
  async (repos, today) => {
    await repos.setup.saveSetup(typicalSetup({ onboardedOn: today.addDays(-60), healthCheckConfirmedOn: today }));
    await repos.weights.saveWeight(today, 82);
    await repos.targets.saveTargets(storyTargets(today.addDays(-30), { kcal: 2175 }));
    const shown = today.addDays(-1);
    for (let i = 1; i <= usualDays; i++) await day(repos, shown.addDays(-i), 900);
    await day(repos, shown, 1200);
  };
